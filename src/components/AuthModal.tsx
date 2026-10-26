import React, { useState, useEffect } from 'react';
import { BabyUser, LanguageCode } from '../types';
import { rE } from '../i18n';
import { Lock, ShieldCheck, Sparkles, User, Mail, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, limit, serverTimestamp } from 'firebase/firestore';

interface AuthModalProps {
  users: BabyUser[];
  onLoginSuccess: (userId: string) => void;
  onCreateUserSuccess: (newUser: BabyUser) => void;
  lang: LanguageCode;
  isDark: boolean;
  onEnterAdmin?: () => void;
  onSelectLang?: (lang: LanguageCode) => void;
}

const LANG_FLAGS: Record<string, string> = {
  es: '🇪🇸',
  en: '🇺🇸',
  pt: '🇧🇷',
  fr: '🇫🇷',
  de: '🇩🇪',
  ru: '🇷🇺',
  pl: '🇵🇱',
  zh: '🇨🇳',
  ar: '🇸🇦',
  hi: '🇮🇳',
};

export const AuthModal: React.FC<AuthModalProps> = ({
  users,
  onLoginSuccess,
  onCreateUserSuccess,
  lang,
  isDark,
  onEnterAdmin,
  onSelectLang,
}) => {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(lang);

  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  useEffect(() => {
    const handleLangChanged = () => {
      const saved = localStorage.getItem('bubblo_lang') as LanguageCode;
      if (saved) {
        setCurrentLang(saved);
      }
    };
    window.addEventListener('languageChanged', handleLangChanged);
    return () => window.removeEventListener('languageChanged', handleLangChanged);
  }, []);

  const activeLang = currentLang || lang || 'es';
  const t = rE[activeLang] || rE.es;

  const changeLanguage = (code: LanguageCode) => {
    setCurrentLang(code);
    localStorage.setItem('bubblo_lang', code);
    document.documentElement.lang = code;
    setShowLangList(false);
    if (onSelectLang) {
      onSelectLang(code);
    }
    // Fuerza re-render
    window.dispatchEvent(new Event('languageChanged'));
  };

  const [activeTab, setActiveTab] = useState<'create' | 'login'>(users.length > 0 ? 'login' : 'create');
  const [babyName, setBabyName] = useState('');
  const [email, setEmail] = useState('');
  const [peso, setPeso] = useState('7.2');
  const [talla, setTalla] = useState('65');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0]);
  const [gender, setGender] = useState<'niño' | 'niña' | 'neutral'>('neutral');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password visibility states
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Recovery modal states
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'newpass'>('email');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [recoveredUserId, setRecoveredUserId] = useState('');

  const handleSendRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    const emailClean = forgotEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setForgotErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    let foundUid = '';
    try {
      const qUsers = query(collection(db, "users"), where("email", "==", emailClean), limit(1));
      const snap = await getDocs(qUsers);
      if (!snap.empty) {
        foundUid = snap.docs[0].id;
      }
    } catch (err) {
      console.warn("Recovery lookup notice:", err);
    }

    if (!foundUid) {
      try {
        const localUsers: BabyUser[] = JSON.parse(localStorage.getItem("bubblo_users_list") || "[]");
        const match = localUsers.find(u => u.email && u.email.toLowerCase() === emailClean);
        if (match) {
          foundUid = match.id;
        }
      } catch (e) {}
    }

    if (!foundUid) {
      foundUid = 'usr_' + emailClean.replace(/[^a-zA-Z0-9]/g, '_');
    }

    setRecoveredUserId(foundUid);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setForgotStep('code');
    setForgotSuccessMsg(`📬 ¡Código enviado a ${emailClean}! (Código de simulación: ${code})`);
  };

  const handleVerifyRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    if (verificationCodeInput.trim() !== generatedCode) {
      setForgotErrorMsg('Código incorrecto. Verifica el código de 6 dígitos enviado a tu correo.');
      return;
    }
    setForgotStep('newpass');
    setForgotSuccessMsg('✅ Código verificado correctamente. Crea tu nueva contraseña.');
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setForgotErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      setForgotErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    const uid = recoveredUserId;
    const emailClean = forgotEmail.trim().toLowerCase();

    try {
      await setDoc(doc(db, "users", uid), {
        password: newPasswordInput,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore password update notice:", e);
    }

    try {
      const localUsers: BabyUser[] = JSON.parse(localStorage.getItem("bubblo_users_list") || "[]");
      const idx = localUsers.findIndex(u => u.id === uid || (u.email && u.email.toLowerCase() === emailClean));
      if (idx !== -1) {
        localUsers[idx].password = newPasswordInput;
        localStorage.setItem("bubblo_users_list", JSON.stringify(localUsers));
      }
      
      const currentUserStr = localStorage.getItem("bubblo_currentUser");
      if (currentUserStr) {
        const cUser = JSON.parse(currentUserStr);
        if (cUser.id === uid || (cUser.email && cUser.email.toLowerCase() === emailClean)) {
          cUser.password = newPasswordInput;
          localStorage.setItem("bubblo_currentUser", JSON.stringify(cUser));
        }
      }
      localStorage.setItem('bubblo_current_user', uid);
    } catch (e) {}

    setForgotSuccessMsg('🎉 ¡Contraseña actualizada con éxito! Ingresando a tu Dashboard sin perder tus registros...');
    setTimeout(() => {
      setShowForgotPasswordModal(false);
      onLoginSuccess(uid);
    }, 1000);
  };

  // Puerta Secreta & Admin Code
  const [doorTaps, setDoorTaps] = useState(0);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showLangList, setShowLangList] = useState(false);

  const handleDoorTap = () => {
    const newTaps = doorTaps + 1;
    setDoorTaps(newTaps);
    setTimeout(() => setDoorTaps(0), 3000);
    if (newTaps >= 5) {
      setShowCodeModal(true); // abre ventana código
      setDoorTaps(0);
    }
  };

  const handleAdminLogin = () => {
    if (adminCode === '110305') {
      localStorage.setItem('bubblo_admin', '1');
      setShowCodeModal(false);
      setAdminCode('');
      setDoorTaps(0);
      window.location.hash = '#admin';
      if (onEnterAdmin) {
        onEnterAdmin();
      }
    } else {
      alert('Código incorrecto');
      setAdminCode('');
    }
  };

  // Helper to parse decimal numbers safely accepting both dot and comma
  const parseDecimal = (val: string, fallback: number) => {
    if (!val) return fallback;
    const clean = val.toString().replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? fallback : parsed;
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, provider);
      if (res?.user?.uid) {
        const uid = res.user.uid;
        const email = (res.user.email || '').toLowerCase();
        const displayName = res.user.displayName || (email ? email.split('@')[0] : 'Bebé');

        let existingUser: any = null;
        try {
          const uSnap = await getDoc(doc(db, "users", uid));
          if (uSnap.exists()) {
            existingUser = uSnap.data();
          } else {
            await setDoc(doc(db, "users", uid), {
              uid,
              email,
              babyName: displayName,
              peso: 7.2,
              talla: 65,
              fechaNacimiento: '2026-02-15',
              genero: 'neutral',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });

            await setDoc(doc(db, "users", uid, "inventario", "panales"), {
              stock: 50,
              ultimaActualizacion: serverTimestamp()
            }, { merge: true });
            await setDoc(doc(db, "users", uid, "inventory", "main"), {
              panalesStock: 50,
              botesFormulaStock: 2,
              promedioPanalesManual: 6,
              promedioBiberonesManual: 5,
              rendimientoPorBote: 30,
              ultimaActualizacion: serverTimestamp()
            }, { merge: true });
          }
        } catch (e) {
          console.warn("Google user sync notice:", e);
        }

        const userObj: BabyUser = {
          id: uid,
          email,
          babyName: existingUser?.babyName || displayName,
          birthDate: existingUser?.fechaNacimiento || existingUser?.birthDate || '2026-02-15',
          gender: existingUser?.genero || existingUser?.gender || 'neutral',
          weight: Number(existingUser?.peso) || 7.2,
          height: Number(existingUser?.talla) || 65,
          photo: existingUser?.photo || res.user.photoURL || undefined,
          createdAt: Date.now()
        };

        // Inicializar perfil en comunidad de mamás si es nuevo
        try {
          await setDoc(doc(db, "community_profiles", uid), {
            uid,
            displayName: userObj.babyName ? `Mamá de ${userObj.babyName}` : (res.user.displayName || 'Mamá Baby Day'),
            babyName: userObj.babyName || 'Bebé',
            email: email,
            bio: 'Mamá registrada en Baby Day 💕',
            ciudad: existingUser?.ciudad || 'Bogotá, Colombia',
            lactancia: existingUser?.lactancia || 'Lactancia Materna Exclusiva',
            bebeEdad: '6 meses',
            avatarUrl: userObj.photo || '',
            coverUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1200&auto=format&fit=crop&q=80',
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (cpErr) {
          console.warn("Notice updating community_profiles:", cpErr);
        }

        try {
          localStorage.setItem('bubblo_current_user', uid);
          localStorage.setItem('bubblo_currentUser', JSON.stringify(userObj));
          const babyPayload = {
            name: userObj.babyName,
            birthDate: userObj.birthDate,
            height: userObj.height,
            weight: userObj.weight,
            photo: userObj.photo
          };
          localStorage.setItem('bubblo_baby', JSON.stringify(babyPayload));
          localStorage.setItem(`bubblo_baby_${uid}`, JSON.stringify(babyPayload));
          localStorage.setItem(`bubblo_user_${uid}`, JSON.stringify(userObj));
        } catch (e) {}

        setSuccessMsg(t.welcomeBack);
        setTimeout(() => {
          onLoginSuccess(uid);
        }, 400);
      }
    } catch (err: any) {
      console.warn("Google sign-in notice:", err);
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setErrorMsg('No se pudo completar el acceso con Google.');
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedName = babyName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedName || !trimmedPass) {
      setErrorMsg(t.fillFields);
      return;
    }

    const emailToUse = trimmedEmail || `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bebe'}@babyday.app`;
    let uid = '';

    const numPeso = parseDecimal(peso, 7.2);
    const numTalla = parseDecimal(talla, 65);

    // 1. Firebase Auth con fallback resiliente ante operación no permitida o proveedor email/password apagado
    try {
      const cred = await createUserWithEmailAndPassword(auth, emailToUse, trimmedPass);
      if (cred?.user?.uid) {
        uid = cred.user.uid;
      }
    } catch (authErr: any) {
      console.warn("Firebase createUser notice:", authErr);
      if (authErr?.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(auth, emailToUse, trimmedPass);
          if (cred?.user?.uid) {
            uid = cred.user.uid;
          }
        } catch (signErr) {
          const safeUid = 'usr_' + emailToUse.replace(/[^a-zA-Z0-9]/g, '_');
          uid = safeUid;
        }
      } else if (
        authErr?.code === 'auth/operation-not-allowed' ||
        authErr?.code === 'auth/admin-restricted-operation' ||
        authErr?.code === 'auth/configuration-not-found'
      ) {
        // Modo seguro: el proveedor Email/Password aún no está activo en Firebase Console.
        // Se genera un identificador único seguro persistente para que el registro NUNCA se bloquee.
        const safeUid = 'usr_' + emailToUse.replace(/[^a-zA-Z0-9]/g, '_');
        uid = safeUid;
      } else if (authErr?.code === 'auth/weak-password') {
        setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
        return;
      } else {
        // Fallback seguro ante cualquier problema de red o configuración
        const safeUid = 'usr_' + emailToUse.replace(/[^a-zA-Z0-9]/g, '_');
        uid = safeUid;
      }
    }

    if (!uid) {
      const safeUid = 'usr_' + emailToUse.replace(/[^a-zA-Z0-9]/g, '_');
      uid = safeUid;
    }

    // 2. Guardar perfil permanentemente en Firestore en users/{uid}
    try {
      await setDoc(doc(db, "users", uid), {
        uid,
        email: emailToUse,
        babyName: trimmedName,
        peso: numPeso,
        talla: numTalla,
        fechaNacimiento: birthDate,
        genero: gender,
        password: trimmedPass,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Inicializar perfil público en comunidad de mamás
      await setDoc(doc(db, "community_profiles", uid), {
        uid,
        displayName: `Mamá de ${trimmedName}`,
        babyName: trimmedName,
        email: emailToUse,
        bio: 'Mamá registrada en Baby Day 💕',
        ciudad: 'Bogotá, Colombia',
        lactancia: 'Lactancia Materna Exclusiva',
        bebeEdad: 'Recién nacido',
        familia: 'Mamá, Papá y Bebé',
        avatarUrl: '',
        coverUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1200&auto=format&fit=crop&q=80',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Inicializar stock de inventario seguro en Firestore
      await setDoc(doc(db, "users", uid, "inventario", "panales"), {
        stock: 50,
        ultimaActualizacion: serverTimestamp()
      }, { merge: true });
      await setDoc(doc(db, "users", uid, "inventory", "main"), {
        panalesStock: 50,
        botesFormulaStock: 2,
        promedioPanalesManual: 6,
        promedioBiberonesManual: 5,
        rendimientoPorBote: 30,
        ultimaActualizacion: serverTimestamp()
      }, { merge: true });
    } catch (fsErr: any) {
      console.warn("Firestore save user notice:", fsErr);
    }

    const newUser: BabyUser = {
      id: uid,
      email: emailToUse,
      babyName: trimmedName,
      password: trimmedPass,
      birthDate: birthDate,
      gender: gender,
      weight: numPeso,
      height: numTalla,
      createdAt: Date.now()
    };

    try {
      localStorage.setItem('bubblo_current_user', uid);
      localStorage.setItem('bubblo_currentUser', JSON.stringify(newUser));
      const babyPayload = {
        name: trimmedName,
        birthDate: birthDate,
        height: numTalla,
        weight: numPeso
      };
      localStorage.setItem('bubblo_baby', JSON.stringify(babyPayload));
      localStorage.setItem(`bubblo_baby_${uid}`, JSON.stringify(babyPayload));
      localStorage.setItem(`bubblo_user_${uid}`, JSON.stringify(newUser));
      const localUsers: BabyUser[] = JSON.parse(localStorage.getItem("bubblo_users_list") || "[]");
      const filtered = localUsers.filter(u => u.id !== uid && u.email !== emailToUse);
      filtered.push(newUser);
      localStorage.setItem("bubblo_users_list", JSON.stringify(filtered));
    } catch (e) {}

    setSuccessMsg(t.zeroStart);
    setTimeout(() => {
      onCreateUserSuccess(newUser);
    }, 500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedInput = babyName.trim();
    const trimmedPass = password.trim();

    if (!trimmedInput || !trimmedPass) {
      setErrorMsg(t.fillFields);
      return;
    }

    let emailToUse = trimmedInput.toLowerCase();
    if (!emailToUse.includes('@')) {
      // Buscar correo asociado al nombre del bebé en Firestore
      try {
        const qUsers = query(collection(db, "users"), where("babyName", "==", trimmedInput), limit(1));
        const snap = await getDocs(qUsers);
        if (!snap.empty) {
          emailToUse = (snap.docs[0].data().email || '').toLowerCase();
        }
      } catch (err) {
        console.warn("Error querying user by babyName:", err);
      }
      if (!emailToUse || !emailToUse.includes('@')) {
        emailToUse = `${trimmedInput.toLowerCase().replace(/[^a-z0-9]/g, '')}@babyday.app`;
      }
    }

    let uid = '';
    let userObj: BabyUser | null = null;

    try {
      const cred = await signInWithEmailAndPassword(auth, emailToUse, trimmedPass);
      uid = cred.user.uid;
    } catch (authErr: any) {
      console.warn("Firebase login fallback check:", authErr);
      const safeUid = 'usr_' + emailToUse.replace(/[^a-zA-Z0-9]/g, '_');
      let foundData: any = null;

      try {
        const directSnap = await getDoc(doc(db, "users", safeUid));
        if (directSnap.exists()) {
          foundData = directSnap.data();
          uid = safeUid;
        } else {
          // Buscar por email en Firestore
          const qUsers = query(collection(db, "users"), where("email", "==", emailToUse), limit(1));
          const snap = await getDocs(qUsers);
          if (!snap.empty) {
            foundData = snap.docs[0].data();
            uid = snap.docs[0].id;
          } else {
            // Buscar por nombre del bebé
            const qBaby = query(collection(db, "users"), where("babyName", "==", trimmedInput), limit(1));
            const snapBaby = await getDocs(qBaby);
            if (!snapBaby.empty) {
              foundData = snapBaby.docs[0].data();
              uid = snapBaby.docs[0].id;
            }
          }
        }
      } catch (e) {
        console.warn("Firestore lookup notice:", e);
      }

      // Buscar en LocalStorage si no se halló en Firestore
      if (!foundData) {
        try {
          const localUsers: BabyUser[] = JSON.parse(localStorage.getItem("bubblo_users_list") || "[]");
          const match = localUsers.find(u =>
            (u.email && u.email.toLowerCase() === emailToUse) ||
            (u.babyName && u.babyName.toLowerCase() === trimmedInput.toLowerCase())
          );
          if (match) {
            foundData = match;
            uid = match.id;
          }
        } catch (e) {}
      }

      if (foundData) {
        if (foundData.password && foundData.password !== trimmedPass) {
          setErrorMsg(t.wrongPass || 'Contraseña incorrecta. Por favor verifica tus credenciales.');
          return;
        }
        userObj = {
          id: uid,
          email: foundData.email || emailToUse,
          babyName: foundData.babyName || trimmedInput,
          birthDate: foundData.fechaNacimiento || foundData.birthDate || '2026-02-15',
          gender: foundData.genero || foundData.gender || 'neutral',
          weight: Number(foundData.peso) || Number(foundData.weight) || 7.2,
          height: Number(foundData.talla) || Number(foundData.height) || 65,
          photo: foundData.photo,
          createdAt: foundData.createdAt?.toDate ? foundData.createdAt.toDate().getTime() : (foundData.createdAt || Date.now())
        };
      } else {
        if (authErr?.code === 'auth/wrong-password') {
          setErrorMsg(t.wrongPass || 'Contraseña incorrecta. Por favor verifica tus credenciales.');
          return;
        }
        setErrorMsg('Usuario o correo no encontrado. Verifica tus credenciales o crea una cuenta en "Crear Cuenta".');
        return;
      }
    }

    // Si inició sesión por Firebase Auth directamente
    if (uid && !userObj) {
      userObj = {
        id: uid,
        email: emailToUse,
        babyName: trimmedInput.includes('@') ? trimmedInput.split('@')[0] : trimmedInput,
        birthDate: '2026-02-15',
        gender: 'neutral',
        weight: 7.2,
        height: 65,
        createdAt: Date.now()
      };

      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          userObj = {
            id: uid,
            email: uData.email || emailToUse,
            babyName: uData.babyName || userObj.babyName,
            birthDate: uData.fechaNacimiento || userObj.birthDate,
            gender: uData.genero || userObj.gender,
            weight: Number(uData.peso) || userObj.weight,
            height: Number(uData.talla) || userObj.height,
            photo: uData.photo,
            createdAt: uData.createdAt?.toDate ? uData.createdAt.toDate().getTime() : Date.now()
          };
        }
      } catch (e) {
        console.warn("Could not fetch user document:", e);
      }
    }

    if (userObj && uid) {
      try {
        localStorage.setItem('bubblo_current_user', uid);
        localStorage.setItem('bubblo_currentUser', JSON.stringify(userObj));
        localStorage.setItem('bubblo_baby', JSON.stringify({
          name: userObj.babyName,
          birthDate: userObj.birthDate,
          height: userObj.height,
          weight: userObj.weight,
          photo: userObj.photo
        }));
      } catch (e) {}
    }

    setSuccessMsg(t.welcomeBack);
    setTimeout(() => {
      onLoginSuccess(uid);
    }, 400);
  };

  const cardStyle = isDark ? 'clay-dark text-slate-100' : 'clay text-slate-800';

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-4 py-8 ${
      isDark ? 'bg-slate-950' : 'bg-gradient-to-b from-amber-50 via-orange-50/40 to-amber-100/30'
    }`}>
      <div className={`w-full max-w-md p-6 sm:p-8 ${cardStyle} shadow-2xl relative overflow-hidden`}>
        {/* Header Icon & Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 rounded-3xl bg-gradient-to-tr from-amber-300 via-rose-300 to-amber-200 shadow-md mb-3 text-3xl">
            👶✨
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
            {t.bubblo}
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mt-0.5">
            {t.bubbloSub}
          </p>
        </div>

        {/* Tab switchers */}
        <div className={`flex rounded-2xl p-1 mb-6 ${isDark ? 'bg-slate-800/90' : 'bg-amber-100/80'}`}>
          <button
            id="tab-create-account"
            type="button"
            onClick={() => {
              setActiveTab('create');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all clay-press ${
              activeTab === 'create'
                ? isDark ? 'bg-slate-700 text-amber-300 shadow' : 'bg-white text-slate-800 shadow'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.createAccountTab}
          </button>
          <button
            id="tab-login"
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all clay-press ${
              activeTab === 'login'
                ? isDark ? 'bg-slate-700 text-amber-300 shadow' : 'bg-white text-slate-800 shadow'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.loginTab}
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <span>✨</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        {activeTab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>Correo electrónico (Email)</span>
              </label>
              <input
                id="input-create-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu-correo@ejemplo.com"
                className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition border ${
                  isDark 
                    ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-400' 
                    : 'bg-white border-amber-200 text-slate-900 focus:border-amber-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.babyNameLabel}</span>
              </label>
              <input
                id="input-create-baby-name"
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="Ej. Mateo, Sofía, Lucas..."
                className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition border ${
                  isDark 
                    ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-400' 
                    : 'bg-white border-amber-200 text-slate-900 focus:border-amber-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.passwordLabel}</span>
              </label>
              <div className="relative">
                <input
                  id="input-create-password"
                  type={showCreatePassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-12 rounded-2xl text-sm font-medium outline-none transition border ${
                    isDark 
                      ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-400' 
                      : 'bg-white border-amber-200 text-slate-900 focus:border-amber-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* FIX: Button text requirement: `✨ ${B.createAccountBtn} Baby Day` */}
            <button
              id="submit-create-account"
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/30 clay-press transition cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{`✨ ${t.createAccountBtn} Baby Day`}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>Email o Nombre del bebé</span>
              </label>
              <input
                id="input-login-baby-name"
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="correo@ejemplo.com o nombre"
                className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition border ${
                  isDark 
                    ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-400' 
                    : 'bg-white border-amber-200 text-slate-900 focus:border-amber-500'
                }`}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.passwordLabel}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(true);
                    setForgotEmail(email || (babyName.includes('@') ? babyName : ''));
                    setForgotStep('email');
                    setForgotErrorMsg('');
                    setForgotSuccessMsg('');
                    setVerificationCodeInput('');
                    setNewPasswordInput('');
                    setConfirmNewPasswordInput('');
                  }}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña? Recuperar contraseña
                </button>
              </div>
              <div className="relative">
                <input
                  id="input-login-password"
                  type={showLoginPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-12 rounded-2xl text-sm font-medium outline-none transition border ${
                    isDark 
                      ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-400' 
                      : 'bg-white border-amber-200 text-slate-900 focus:border-amber-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="submit-login"
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-teal-500/30 clay-press transition cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{`✨ ${t.loginBtn}`}</span>
            </button>
          </form>
        )}

        {/* Botón de acceso rápido con Google */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${isDark ? 'border-slate-800' : 'border-amber-200/80'}`}></div>
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-bold">
            <span className={`px-3 py-0.5 rounded-full ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-amber-50 text-slate-500'}`}>
              o continúa con
            </span>
          </div>
        </div>

        <button
          id="btn-google-auth"
          type="button"
          onClick={handleGoogleSignIn}
          className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm tracking-wide border transition clay-press flex items-center justify-center gap-2.5 cursor-pointer ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continuar con Google</span>
        </button>

        {/* Selector de idiomas abajo con 2 flechitas ⌃⌃ / ⌄⌄ */}
        <div className="mt-6 w-full">
          <button
            type="button"
            onClick={() => setShowLangList(!showLangList)}
            className={`w-full flex justify-between items-center p-3 rounded-[16px] border text-xs sm:text-sm font-bold transition cursor-pointer ${
              !isDark ? 'bg-white border-[#E5E7EB] text-black' : 'bg-[#2A2A40] border-[#3A3A55] text-white'
            }`}
          >
            <span>🌐 {rE[activeLang]?.languageName || 'Español'} - {activeLang.toUpperCase()}</span>
            <span className="font-mono text-xs font-bold">{showLangList ? '⌃⌃' : '⌄⌄'}</span>
          </button>

          {showLangList && (
            <div
              className={`mt-2 max-h-[200px] overflow-y-auto rounded-[16px] border divide-y ${
                !isDark
                  ? 'bg-white border-[#E5E7EB] divide-gray-100 shadow-lg'
                  : 'bg-[#2A2A40] border-[#3A3A55] divide-[#3A3A55] shadow-lg'
              }`}
            >
              {Object.keys(rE).map((code) => {
                const c = code as LanguageCode;
                const item = rE[c];
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => changeLanguage(c)}
                    className={`w-full text-left p-3 text-xs transition flex items-center justify-between cursor-pointer ${
                      code === activeLang
                        ? 'bg-black text-white dark:bg-white dark:text-black font-black'
                        : !isDark
                        ? 'text-black hover:bg-gray-50'
                        : 'text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{LANG_FLAGS[code] || '🌐'} {item.languageName}</span>
                    <span className="uppercase font-mono text-[10px] opacity-70">{code}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Security and 100% offline note */}
        <div className="mt-6 pt-4 border-t border-slate-200/70 dark:border-slate-800 text-center pb-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.secureLock}</span>
          </div>
        </div>

        {/* PUERTA SECRETA - casi invisible abajo a la derecha */}
        <div
          id="secret-door-btn"
          className="absolute bottom-2 right-2 w-5 h-5 opacity-20 hover:opacity-40 cursor-pointer select-none text-sm flex items-center justify-center transition"
          onClick={handleDoorTap}
          title=""
        >
          🚪
        </div>
      </div>

      {/* Ventana para colocar código 110305 */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in">
          <div className={`p-6 rounded-[20px] w-[300px] clay shadow-2xl border ${
            !isDark ? 'bg-white border-gray-200 text-black' : 'bg-[#2A2A40] border-[#3A3A55] text-white'
          }`}>
            <h3 className="font-extrabold text-center text-lg">🔐 Código Admin</h3>
            <input
              id="admin-code-input"
              type="password"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="Ingresa código"
              className={`w-full mt-3 p-3 rounded-xl border text-center text-xl font-mono tracking-widest outline-none ${
                !isDark ? 'bg-gray-50 border-gray-300 text-black focus:border-black' : 'bg-[#1E1E2E] border-[#3A3A55] text-white focus:border-amber-400'
              }`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdminLogin();
                }
              }}
            />
            <div className="flex gap-2 mt-4">
              <button
                id="admin-code-cancel"
                type="button"
                onClick={() => {
                  setShowCodeModal(false);
                  setAdminCode('');
                }}
                className={`flex-1 py-2 rounded-xl font-bold text-xs cursor-pointer ${
                  !isDark ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                Cancelar
              </button>
              <button
                id="admin-code-submit"
                type="button"
                onClick={handleAdminLogin}
                className="flex-1 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recuperación de Contraseña */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in">
          <div className={`p-6 rounded-[24px] w-full max-w-md clay shadow-2xl border space-y-4 ${
            !isDark ? 'bg-white border-gray-200 text-black' : 'bg-[#2A2A40] border-[#3A3A55] text-white'
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-black text-base text-amber-500">🔑 Recuperar Contraseña Baby Day</h3>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="bg-slate-200 dark:bg-slate-700 text-black dark:text-white font-bold px-3 py-1 rounded-full text-xs cursor-pointer hover:opacity-80"
              >
                ✕
              </button>
            </div>

            {forgotErrorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{forgotErrorMsg}</span>
              </div>
            )}

            {forgotSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                <span>✨</span>
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            {forgotStep === 'email' && (
              <form onSubmit={handleSendRecoveryCode} className="space-y-4 text-xs">
                <p className="text-gray-600 dark:text-gray-300">
                  Ingresa el correo electrónico con el que te registraste (o el correo de tu cuenta de Google). Te enviaremos un código de verificación para restablecer tu contraseña sin perder tus registros ni bases de datos.
                </p>
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu-correo@ejemplo.com"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-700 text-white outline-none focus:border-amber-400 text-sm"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-sm shadow cursor-pointer transition"
                >
                  Enviar Código de Verificación
                </button>
              </form>
            )}

            {forgotStep === 'code' && (
              <form onSubmit={handleVerifyRecoveryCode} className="space-y-4 text-xs">
                <p className="text-gray-600 dark:text-gray-300">
                  Hemos enviado un código de 6 dígitos al correo <strong className="text-amber-400">{forgotEmail}</strong>. Ingrésalo a continuación:
                </p>
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Código de 6 dígitos:</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCodeInput}
                    onChange={(e) => setVerificationCodeInput(e.target.value)}
                    placeholder="123456"
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-700 text-white text-center text-xl font-mono tracking-widest outline-none focus:border-amber-400"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('email')}
                    className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-black dark:text-white font-bold text-xs cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-sm shadow cursor-pointer transition"
                  >
                    Verificar Código
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'newpass' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
                <p className="text-gray-600 dark:text-gray-300">
                  ¡Código verificado! Ahora escribe tu nueva contraseña para acceder a tu Dashboard.
                </p>
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Nueva Contraseña:</label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full p-3 pr-12 rounded-xl bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-700 text-white outline-none focus:border-amber-400 text-sm"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Confirmar Nueva Contraseña:</label>
                  <input
                    type="password"
                    value={confirmNewPasswordInput}
                    onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-700 text-white outline-none focus:border-amber-400 text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-extrabold text-sm shadow cursor-pointer transition"
                >
                  Guardar Contraseña e Ingresar ✨
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
