'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './interpretation.module.css';

interface DemoMessage {
  type: 'patient' | 'doctor';
  speaker: string;
  originalLang: string;
  translatedLang: string;
  original: string;
  translation: string;
  delay: number;
}

interface ConversationKeywords {
  [key: string]: Array<{ en: string; es: string }>;
}

interface ConversationPhrases {
  [key: string]: Array<{ es: string; en: string }>;
}

interface PerformanceData {
  fluency: number;
  accuracy: number;
  speed: number;
}

interface SpeechEvent {
  timestamp: number;
  originalWords: number;
  translationWords: number;
  type: string;
}

export default function InterpretationPage() {
  // State variables
  const [demoRunning, setDemoRunning] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [messageIndex, setMessageIndex] = useState(0);
  const [currentWords, setCurrentWords] = useState(0);
  const [totalOriginalWords, setTotalOriginalWords] = useState(0);
  const [totalTranslatedWords, setTotalTranslatedWords] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [speechEvents, setSpeechEvents] = useState<SpeechEvent[]>([]);
  const [startTime, setStartTime] = useState(0);

  // Refs for intervals
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const statsInterval = useRef<NodeJS.Timeout | null>(null);
  const performanceInterval = useRef<NodeJS.Timeout | null>(null);
  const messageTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Demo messages data with realistic conversation timing
  const demoMessages: DemoMessage[] = [
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'Buenos días, doctor. He estado experimentando dolores de cabeza frecuentes durante las últimas dos semanas.',
      translation: 'Good morning, doctor. I have been experiencing frequent headaches for the last two weeks.',
      delay: 2000 // First message after 2 seconds
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'I understand. Can you describe the pain? Is it throbbing, sharp, or more like pressure?',
      translation: 'Entiendo. ¿Puede describir el dolor? ¿Es pulsante, agudo o más como una presión?',
      delay: 4500 // Doctor thinks and responds
    },
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'Es como una presión constante en la frente y las sienes. A veces siento náuseas también.',
      translation: 'It\'s like a constant pressure in my forehead and temples. Sometimes I also feel nauseous.',
      delay: 5000 // Patient describes symptoms
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'How long do these headaches typically last? And do they occur at specific times of the day?',
      translation: '¿Cuánto tiempo suelen duran estos dolores de cabeza? ¿Y ocurren en momentos específicos del día?',
      delay: 3500 // Follow-up question
    },
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'Generalmente duran varias horas. Casi siempre empiezan por la mañana cuando me despierto.',
      translation: 'They usually last several hours. They almost always start in the morning when I wake up.',
      delay: 4000 // Patient recalls pattern
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'Are you currently taking any medications for the headaches?',
      translation: '¿Está tomando actualmente algún medicamento para los dolores de cabeza?',
      delay: 3000 // Quick medical question
    },
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'Sí, he estado tomando ibuprofeno, pero no ayuda mucho. También probé acetaminofén sin mejores resultados.',
      translation: 'Yes, I have been taking ibuprofen, but it doesn\'t help much. I also tried acetaminophen without better results.',
      delay: 5500 // Longer response about medications
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'Have you noticed any triggers? Like certain foods, stress, or changes in sleep patterns?',
      translation: '¿Ha notado algún desencadenante? ¿Como ciertos alimentos, estrés o cambios en los patrones de sueño?',
      delay: 4000 // Probing for triggers
    },
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'Ahora que lo menciona, he estado muy estresado en el trabajo. También he estado durmiendo mal.',
      translation: 'Now that you mention it, I have been very stressed at work. I have also been sleeping poorly.',
      delay: 6000 // Patient reflects on lifestyle
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'Stress and poor sleep are common triggers for tension headaches. How many hours of sleep do you get per night?',
      translation: 'El estrés y el mal sueño son desencadenantes comunes de los dolores de cabeza por tensión. ¿Cuántas horas de sueño tiene por noche?',
      delay: 4500 // Doctor explains and asks specific question
    },
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'Solo unas cuatro o cinco horas. Me quedo despierto hasta muy tarde preocupándome por el trabajo.',
      translation: 'Only about four or five hours. I stay awake until very late worrying about work.',
      delay: 4500 // Patient admits sleep issues
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'That\'s definitely insufficient sleep. Adults need seven to nine hours. Do you consume caffeine regularly?',
      translation: 'Eso definitivamente es sueño insuficiente. Los adultos necesitan de siete a nueve horas. ¿Consume cafeína regularmente?',
      delay: 3500 // Educational response + question
    },
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'Sí, bebo mucho café durante el día para mantenerme despierto. Probablemente cinco o seis tazas.',
      translation: 'Yes, I drink a lot of coffee during the day to stay awake. Probably five or six cups.',
      delay: 4000 // Patient estimates caffeine intake
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'Excessive caffeine can actually worsen headaches and interfere with sleep. Have you experienced any vision problems?',
      translation: 'El exceso de cafeína puede empeorar los dolores de cabeza e interferir con el sueño. ¿Ha experimentado problemas de visión?',
      delay: 5000 // Doctor educates and asks about symptoms
    },
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'A veces veo manchas brillantes antes de que empiece el dolor de cabeza. También la luz me molesta mucho.',
      translation: 'Sometimes I see bright spots before the headache starts. Light also bothers me a lot.',
      delay: 5500 // Patient describes visual symptoms
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'Those symptoms suggest you might be experiencing migraines rather than just tension headaches. I recommend reducing caffeine and improving sleep habits.',
      translation: 'Esos síntomas sugieren que podría estar experimentando migrañas en lugar de solo dolores de cabeza por tensión. Recomiendo reducir la cafeína y mejorar los hábitos de sueño.',
      delay: 6000 // Final diagnosis and recommendations
    }
  ];

  // Keywords and phrases based on conversation progress
  const conversationKeywords: ConversationKeywords = {
    initial: [
      { en: 'Headache', es: 'Dolor de cabeza' },
      { en: 'Pain', es: 'Dolor' },
      { en: 'Pressure', es: 'Presión' },
      { en: 'Temples', es: 'Sienes' }
    ],
    symptoms: [
      { en: 'Nausea', es: 'Náuseas' },
      { en: 'Forehead', es: 'Frente' },
      { en: 'Throbbing', es: 'Pulsante' },
      { en: 'Duration', es: 'Duración' }
    ],
    medication: [
      { en: 'Ibuprofen', es: 'Ibuprofeno' },
      { en: 'Acetaminophen', es: 'Acetaminofén' },
      { en: 'Medication', es: 'Medicamento' },
      { en: 'Treatment', es: 'Tratamiento' }
    ],
    lifestyle: [
      { en: 'Stress', es: 'Estrés' },
      { en: 'Sleep', es: 'Sueño' },
      { en: 'Trigger', es: 'Desencadenante' },
      { en: 'Work', es: 'Trabajo' }
    ],
    advanced: [
      { en: 'Caffeine', es: 'Cafeína' },
      { en: 'Vision', es: 'Visión' },
      { en: 'Migraine', es: 'Migraña' },
      { en: 'Light sensitivity', es: 'Sensibilidad a la luz' }
    ]
  };

  const conversationPhrases: ConversationPhrases = {
    initial: [
      { es: '¿Desde cuándo tiene estos síntomas?', en: 'How long have you had these symptoms?' },
      { es: '¿Puede describir el dolor?', en: 'Can you describe the pain?' },
      { es: '¿Dónde siente el dolor?', en: 'Where do you feel the pain?' }
    ],
    symptoms: [
      { es: '¿El dolor es constante?', en: 'Is the pain constant?' },
      { es: '¿Tiene otros síntomas?', en: 'Do you have other symptoms?' },
      { es: '¿Cuándo comenzó esto?', en: 'When did this start?' }
    ],
    medication: [
      { es: '¿Qué medicamentos toma?', en: 'What medications do you take?' },
      { es: '¿Le ayuda el medicamento?', en: 'Does the medication help?' },
      { es: '¿Tiene alergias?', en: 'Do you have allergies?' }
    ],
    lifestyle: [
      { es: '¿Cómo duerme?', en: 'How do you sleep?' },
      { es: '¿Está estresado?', en: 'Are you stressed?' },
      { es: '¿Qué desencadena el dolor?', en: 'What triggers the pain?' }
    ],
    advanced: [
      { es: '¿Ve manchas brillantes?', en: 'Do you see bright spots?' },
      { es: '¿La luz le molesta?', en: 'Does light bother you?' },
      { es: '¿Cuánta cafeína consume?', en: 'How much caffeine do you consume?' }
    ]
  };

  // Performance data
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    fluency: 88,
    accuracy: 96,
    speed: 0
  });

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (statsInterval.current) clearInterval(statsInterval.current);
      if (performanceInterval.current) clearInterval(performanceInterval.current);
      messageTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Calculate conversation speed
  const calculateConversationSpeed = () => {
    if (!conversationStarted || seconds === 0) return 0;
    const totalWords = totalOriginalWords + totalTranslatedWords;
    const wordsPerMinute = Math.round((totalWords / seconds) * 60);
    return Math.max(0, wordsPerMinute);
  };

  // Start/Restart demo
  const startDemo = () => {
    if (demoRunning) {
      resetDemo();
      return;
    }

    console.log('Starting demo...');
    
    // Clear any existing timeouts/intervals first to prevent overlaps
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (statsInterval.current) clearInterval(statsInterval.current);
    if (performanceInterval.current) clearInterval(performanceInterval.current);
    messageTimeouts.current.forEach(timeout => clearTimeout(timeout));
    messageTimeouts.current = [];
    
    // Reset all states
    setDemoRunning(true);
    setConversationStarted(true);
    setStartTime(Date.now());
    setMessages([]);
    setSeconds(0);
    setMessageIndex(0);
    setCurrentWords(0);
    setTotalOriginalWords(0);
    setTotalTranslatedWords(0);
    setSpeechEvents([]);

    // Start demo functions
    startTimer();
    addMessagesSequentially();
    startStatsUpdates();
    startPerformanceMetrics();
    
    console.log('Demo started successfully');
  };

  const resetDemo = () => {
    console.log('Resetting demo...');
    
    // Clear intervals and timeouts FIRST to prevent race conditions
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (statsInterval.current) {
      clearInterval(statsInterval.current);
      statsInterval.current = null;
    }
    if (performanceInterval.current) {
      clearInterval(performanceInterval.current);
      performanceInterval.current = null;
    }
    
    // Clear message timeouts
    messageTimeouts.current.forEach(timeout => clearTimeout(timeout));
    messageTimeouts.current = [];
    
    // Reset all states
    setDemoRunning(false);
    setConversationStarted(false);
    setMessages([]);
    setSeconds(0);
    setMessageIndex(0);
    setCurrentWords(0);
    setTotalOriginalWords(0);
    setTotalTranslatedWords(0);
    setSpeechEvents([]);
    
    console.log('Demo reset complete');
  };

  const startTimer = () => {
    timerInterval.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
  };

  const addMessagesSequentially = () => {
    let cumulativeDelay = 0;
    
    demoMessages.forEach((msg, index) => {
      // Add this message's delay to the cumulative delay
      cumulativeDelay += msg.delay / speedMultiplier;
      
      const timeoutId = setTimeout(() => {
        // Double check that demo is still running and prevent duplicates
        setDemoRunning(currentRunning => {
          if (!currentRunning) {
            console.log('Demo stopped, skipping message:', index + 1);
            return currentRunning;
          }
          
          console.log(`Adding message ${index + 1} after ${Math.round(cumulativeDelay)}ms:`, msg.speaker, '-', msg.original.substring(0, 50) + '...');
          
          // Check if this message already exists (prevent duplicates)
          setMessages(prevMessages => {
            const messageExists = prevMessages.some(existingMsg => 
              existingMsg.original === msg.original && 
              existingMsg.speaker === msg.speaker
            );
            
            if (messageExists) {
              console.log('Message already exists, skipping duplicate:', index + 1);
              return prevMessages;
            }
            
            // Count words for speed calculation
            const originalWords = msg.original.split(' ').length;
            const translationWords = msg.translation.split(' ').length;
            
            setTotalOriginalWords(prev => prev + originalWords);
            setTotalTranslatedWords(prev => prev + translationWords);
            setCurrentWords(prev => prev + originalWords + translationWords);
            setMessageIndex(prev => prev + 1);
            
            // Record speech event
            setSpeechEvents(prev => [...prev, {
              timestamp: Date.now() - startTime,
              originalWords: originalWords,
              translationWords: translationWords,
              type: msg.type
            }]);
            
            // Add message to the beginning of the array (newest first)
            return [msg, ...prevMessages];
          });
          
          return currentRunning;
        });
      }, cumulativeDelay);
      
      messageTimeouts.current.push(timeoutId);
    });
  };

  const startStatsUpdates = () => {
    setTimeout(() => {
      if (!demoRunning) return;
      console.log('Stats updated');
    }, 3000);
    
    // Regular updates for accuracy fluctuation
    statsInterval.current = setInterval(() => {
      setDemoRunning(currentRunning => {
        if (!currentRunning) return currentRunning;
        // Update stats periodically
        return currentRunning;
      });
    }, 5000);
  };

  const startPerformanceMetrics = () => {
    setTimeout(() => {
      setDemoRunning(currentRunning => {
        if (!currentRunning) return currentRunning;
        animatePerformanceBars();
        return currentRunning;
      });
    }, 2000);
    
    performanceInterval.current = setInterval(() => {
      setDemoRunning(currentRunning => {
        if (!currentRunning) return currentRunning;
        updatePerformanceMetrics();
        return currentRunning;
      });
    }, 4000);
  };

  const animatePerformanceBars = () => {
    // Initial animation values
    setPerformanceData({
      fluency: 88,
      accuracy: 96,
      speed: Math.min(100, Math.max(0, (calculateConversationSpeed() / 180) * 100))
    });
  };

  const updatePerformanceMetrics = () => {
    setPerformanceData(prev => ({
      fluency: Math.max(0, Math.min(100, prev.fluency + (Math.random() * 3) - 1.5)),
      accuracy: Math.max(0, Math.min(100, prev.accuracy + (Math.random() * 2) - 1)),
      speed: Math.min(100, Math.max(0, (calculateConversationSpeed() / 180) * 100))
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification(`Copied: ${text}`);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      showNotification('Failed to copy text', 'error');
    });
  };

  const showNotification = (message: string, type: string = 'success') => {
    // Implementation for showing notifications
    console.log(`${type}: ${message}`);
  };

  const getCurrentKeywords = () => {
    if (messageIndex < 3) return conversationKeywords.initial;
    if (messageIndex < 6) return conversationKeywords.symptoms;
    if (messageIndex < 9) return conversationKeywords.medication;
    if (messageIndex < 12) return conversationKeywords.lifestyle;
    return conversationKeywords.advanced;
  };

  const getCurrentPhrases = () => {
    if (messageIndex < 3) return conversationPhrases.initial;
    if (messageIndex < 6) return conversationPhrases.symptoms;
    if (messageIndex < 9) return conversationPhrases.medication;
    if (messageIndex < 12) return conversationPhrases.lifestyle;
    return conversationPhrases.advanced;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAccuracyRate = () => {
    return demoRunning ? '96.2%' : '--';
  };

  const getSpeakingPace = () => {
    const wpm = calculateConversationSpeed();
    return demoRunning ? `${wpm} WPM` : '-- WPM';
  };

  const getQualityFillClass = (value: number) => {
    if (value >= 70) return styles.interprompterQualityFillHigh;
    if (value >= 40) return styles.interprompterQualityFillMedium;
    return styles.interprompterQualityFillLow;
  };

  return (
    <div className={styles.interprompterContainer}>
      {/* Animated Background */}
      <div className={styles.interprompterAnimatedBg}></div>
      
      {/* Header */}
      <header className={styles.interprompterHeader}>
        <div className={styles.interprompterLogo}>
<svg width="30" height="30" viewBox="0 0 30 30" fill="currentColor">
<path d="M15 2L2 8v10c0 7.5 5.5 14 13 16c7.5-2 13-8.5 13-16V8L15 2z"/>
</svg>
Interprompter
</div>
        
        <div className={styles.interprompterInfo}>
          <div className={styles.interprompterInfoItem}>
            <span className={styles.interprompterInfoLabel}>Interpreter</span>
            <span className={styles.interprompterInfoValue}>Sarah Johnson</span>
</div>
          <div className={styles.interprompterInfoItem}>
            <span className={styles.interprompterInfoLabel}>Code</span>
            <span className={styles.interprompterInfoValue}>INT-4829</span>
</div>
          <div className={styles.interprompterInfoItem}>
            <span className={styles.interprompterInfoLabel}>Status</span>
            <span 
              className={styles.interprompterInfoValue} 
              style={{ color: demoRunning ? 'var(--interprompter-accent-green)' : 'var(--interprompter-text-secondary)' }}
            >
              {demoRunning ? 'Active' : 'Ready'}
            </span>
</div>
          
          <button 
            className={styles.interprompterDemoButton}
            onClick={startDemo}
          >
<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              {demoRunning ? (
                <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM5.5 4a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-7a.5.5 0 00-.5-.5h-1zm5 0a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-7a.5.5 0 00-.5-.5h-1z"/>
              ) : (
                <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM6.5 5a.5.5 0 00-.5.5v5a.5.5 0 00.5.5.5.5 0 00.354-.146l3.5-3.5a.5.5 0 000-.708l-3.5-3.5A.5.5 0 006.5 5z"/>
              )}
</svg>
            {demoRunning ? 'Restart Demo' : 'Start Demo'}
</button>
          
          <div className={styles.interprompterSpeedSelector}>
            <label className={styles.interprompterInfoLabel}>Speed</label>
            <select 
              className={styles.interprompterSpeedSelect}
              value={speedMultiplier}
              onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
            >
<option value="0.5">0.5x</option>
              <option value="1">1x</option>
<option value="1.5">1.5x</option>
<option value="2">2x</option>
</select>
</div>
</div>
      </header>

      {/* Active Call Indicator */}
      {demoRunning && (
        <div className={styles.interprompterActiveCall}>
          <div className={styles.interprompterRecordingDot}></div>
<span>Live Interpretation</span>
</div>
      )}

      {/* Analytics Bar */}
      <div className={styles.interprompterAnalyticsBar}>
        <div className={styles.interprompterStatCard}>
          <div className={styles.interprompterStatHeader}>
            <span className={styles.interprompterStatTitle}>Call Duration</span>
            <svg className={styles.interprompterStatIcon} viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 4a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 101.414-1.414L11 9.586V6z"/>
</svg>
</div>
          <div className={styles.interprompterStatValue}>
            {formatTime(seconds)}
          </div>
          <div className={`${styles.interprompterStatChange} ${seconds > 5 ? styles.interprompterStatChangePositive : ''}`}>
            <span>⏱️</span>
            <span>{demoRunning ? 'Session active' : 'Ready to start'}</span>
</div>
</div>
        
        <div className={styles.interprompterStatCard}>
          <div className={styles.interprompterStatHeader}>
            <span className={styles.interprompterStatTitle}>Words Interpreted</span>
            <svg className={styles.interprompterStatIcon} viewBox="0 0 20 20" fill="currentColor">
<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2 1 1 0 100-2 2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/>
</svg>
</div>
          <div className={styles.interprompterStatValue}>{currentWords.toLocaleString()}</div>
          <div className={`${styles.interprompterStatChange} ${demoRunning ? styles.interprompterStatChangePositive : ''}`}>
<span>📝</span>
            <span>{demoRunning ? 'Processing active' : 'Waiting...'}</span>
</div>
</div>
        
        <div className={styles.interprompterStatCard}>
          <div className={styles.interprompterStatHeader}>
            <span className={styles.interprompterStatTitle}>Accuracy Rate</span>
            <svg className={styles.interprompterStatIcon} viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
</svg>
</div>
          <div className={styles.interprompterStatValue}>{getAccuracyRate()}</div>
          <div className={`${styles.interprompterStatChange} ${demoRunning ? styles.interprompterStatChangePositive : ''}`}>
<span>🎯</span>
            <span>{demoRunning ? 'High accuracy' : 'Calculating...'}</span>
</div>
</div>
        
        <div className={styles.interprompterStatCard}>
          <div className={styles.interprompterStatHeader}>
            <span className={styles.interprompterStatTitle}>Speaking Pace</span>
            <svg className={styles.interprompterStatIcon} viewBox="0 0 20 20" fill="currentColor">
<path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
</svg>
</div>
          <div className={styles.interprompterStatValue}>{getSpeakingPace()}</div>
          <div className={`${styles.interprompterStatChange} ${demoRunning ? styles.interprompterStatChangePositive : ''}`}>
            <span>🗣️</span>
            <span>{demoRunning ? 'Good pace' : 'Measuring...'}</span>
</div>
</div>
</div>

      {/* Main Content */}
      <div className={styles.interprompterMainContent}>
        {/* Chat Container */}
        <div className={styles.interprompterChatContainer}>
          <div className={styles.interprompterChatHeader}>
            <div className={styles.interprompterLanguagePair}>
              <div 
                className={styles.interprompterLanguageFlag} 
                style={{ background: 'var(--interprompter-doctor-color)' }}
              >
                🩺
              </div>
<span>Doctor</span>
<span>⇄</span>
<span>Patient</span>
              <div 
                className={styles.interprompterLanguageFlag} 
                style={{ background: 'var(--interprompter-patient-color)' }}
              >
                👤
              </div>
</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--interprompter-text-secondary)' }}>
Medical Consultation (EN ⇄ ES)
</div>
</div>
          
          <div className={styles.interprompterChatMessages}>
            {messages.length === 0 ? (
              <div className={styles.interprompterChatPlaceholder}>
                <svg width="60" height="60" viewBox="0 0 60 60" fill="currentColor" opacity="0.3">
                  <path d="M30 10c11.046 0 20 8.954 20 20s-8.954 20-20 20c-2.094 0-4.112-.322-6.01-.92l-7.99 2.66 2.66-7.99A19.914 19.914 0 0110 30c0-11.046 8.954-20 20-20zm0-5C16.193 5 5 16.193 5 30c0 4.368 1.12 8.474 3.087 12.04L3.93 52.303a2.5 2.5 0 003.267 3.267L17.46 51.413C21.026 53.38 25.132 54.5 29.5 54.5 44.031 54.5 56 42.531 56 28S44.031 5 30 5z"/>
</svg>
                <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>Ready to start interpretation</p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Click &quot;Start Demo&quot; to begin the simulation</p>
</div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`${styles.interprompterMessage} ${
                    message.type === 'doctor' 
                      ? styles.interprompterMessageDoctor 
                      : styles.interprompterMessagePatient
                  }`}
                >
                  <div className={styles.interprompterMessageHeader}>
                    <span className={styles.interprompterSpeakerName}>{message.speaker}</span>
                    <span className={styles.interprompterMessageTime}>
                      {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
</div>
                  <div className={`${styles.interprompterLanguageLabel} ${styles.interprompterLanguageLabelOriginal}`}>
                    ORIGINAL ({message.originalLang.toUpperCase()})
</div>
                  <div className={styles.interprompterOriginalText}>{message.original}</div>
                  <div className={`${styles.interprompterLanguageLabel} ${styles.interprompterLanguageLabelTranslation}`}>
                    TRANSLATION ({message.translatedLang.toUpperCase()})
                  </div>
                  <div className={styles.interprompterTranslationText}>{message.translation}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assistant Panel */}
        <div className={styles.interprompterAssistantPanel}>
          {/* Keywords Panel */}
          <div className={styles.interprompterPanelCard}>
            <div className={styles.interprompterPanelHeader}>
<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
</svg>
Key Terms & Phrases
</div>
            <div className={styles.interprompterKeywordsGrid}>
              {getCurrentKeywords().map((term, termIndex) => (
                <div 
                  key={termIndex} 
                  className={styles.interprompterKeywordItem}
                  onClick={() => copyToClipboard(`${term.en} - ${term.es}`)}
                >
<div>
                    <div className={styles.interprompterKeywordText}>{term.en}</div>
                    <div className={styles.interprompterKeywordTranslation}>{term.es}</div>
</div>
</div>
              ))}
</div>
</div>
          
          {/* Common Phrases Panel */}
          <div className={styles.interprompterPanelCard}>
            <div className={styles.interprompterPanelHeader}>
<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"/>
</svg>
Suggested Phrases
</div>
<div>
              {getCurrentPhrases().map((phrase, phraseIndex) => (
                <div 
                  key={phraseIndex} 
                  className={styles.interprompterPhraseItem}
                  onClick={() => copyToClipboard(phrase.es)}
                >
                  <div className={styles.interprompterPhraseOriginal}>{phrase.es}</div>
                  <div className={styles.interprompterPhraseTranslation}>{phrase.en}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Metrics Panel */}
          <div className={styles.interprompterPanelCard}>
            <div className={styles.interprompterPanelHeader}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              Quality Indicators
            </div>
            <div className={styles.interprompterQualityIndicators}>
              <div className={styles.interprompterQualityItem}>
                <div className={styles.interprompterQualityLabel}>Fluency</div>
                <div className={styles.interprompterQualityBar}>
                  <div 
                    className={`${styles.interprompterQualityFill} ${getQualityFillClass(performanceData.fluency)}`}
                    style={{ width: `${performanceData.fluency}%` }}
                  ></div>
                </div>
              </div>
              <div className={styles.interprompterQualityItem}>
                <div className={styles.interprompterQualityLabel}>Accuracy</div>
                <div className={styles.interprompterQualityBar}>
                  <div 
                    className={`${styles.interprompterQualityFill} ${getQualityFillClass(performanceData.accuracy)}`}
                    style={{ width: `${performanceData.accuracy}%` }}
                  ></div>
                </div>
</div>
              <div className={styles.interprompterQualityItem}>
                <div className={styles.interprompterQualityLabel}>Speed</div>
                <div className={styles.interprompterQualityBar}>
                  <div 
                    className={`${styles.interprompterQualityFill} ${getQualityFillClass(performanceData.speed)}`}
                    style={{ width: `${performanceData.speed}%` }}
                  ></div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
  );
}