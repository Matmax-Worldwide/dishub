'use client';

import React, { useState, useRef } from 'react';
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

export default function InterpretationPage() {
  // State variables
  const [demoRunning, setDemoRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Refs for intervals
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const statsInterval = useRef<NodeJS.Timeout | null>(null);
  const performanceInterval = useRef<NodeJS.Timeout | null>(null);

  // Demo messages data
  const demoMessages: DemoMessage[] = [
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'Buenos días, doctor. He estado experimentando dolores de cabeza frecuentes durante las últimas dos semanas.',
      translation: 'Good morning, doctor. I have been experiencing frequent headaches for the last two weeks.',
      delay: 1000
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'I understand. Can you describe the pain? Is it throbbing, sharp, or more like pressure?',
      translation: 'Entiendo. ¿Puede describir el dolor? ¿Es pulsante, agudo o más como una presión?',
      delay: 3000
    },
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'Es como una presión constante en la frente y las sienes. A veces siento náuseas también.',
      translation: 'It\'s like a constant pressure in my forehead and temples. Sometimes I also feel nauseous.',
      delay: 3000
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'How long do these headaches typically last? And do they occur at specific times of the day?',
      translation: '¿Cuánto tiempo suelen durar estos dolores de cabeza? ¿Y ocurren en momentos específicos del día?',
      delay: 3000
    },
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'Generalmente duran varias horas. Casi siempre empiezan por la mañana cuando me despierto.',
      translation: 'They usually last several hours. They almost always start in the morning when I wake up.',
      delay: 3000
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'Are you currently taking any medications for the headaches?',
      translation: '¿Está tomando actualmente algún medicamento para los dolores de cabeza?',
      delay: 2000
    },
    {
      type: 'patient',
      speaker: 'Patient',
      originalLang: 'Spanish',
      translatedLang: 'English',
      original: 'Sí, he estado tomando ibuprofeno, pero no ayuda mucho. También probé acetaminofén sin mejores resultados.',
      translation: 'Yes, I have been taking ibuprofen, but it doesn\'t help much. I also tried acetaminophen without better results.',
      delay: 3000
    },
    {
      type: 'doctor',
      speaker: 'Doctor',
      originalLang: 'English',
      translatedLang: 'Spanish',
      original: 'Have you noticed any triggers? Like certain foods, stress, or changes in sleep patterns?',
      translation: '¿Ha notado algún desencadenante? ¿Como ciertos alimentos, estrés o cambios en los patrones de sueño?',
      delay: 3000
    }
  ];

  return (
    <div className={styles.container}>
      {/* Animated Background */}
      <div className={styles.animatedBg}></div>
      
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="currentColor">
            <path d="M15 2L2 8v10c0 7.5 5.5 14 13 16c7.5-2 13-8.5 13-16V8L15 2z"/>
          </svg>
          Interprompter
        </div>
        
        <div className={styles.interpreterInfo}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Interpreter</span>
            <span className={styles.infoValue}>Sarah Johnson</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Code</span>
            <span className={styles.infoValue}>INT-4829</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Status</span>
            <span className={styles.infoValue} style={{ color: 'var(--text-secondary)' }}>
              {demoRunning ? 'Active' : 'Ready'}
            </span>
          </div>
          
          <button 
            className={styles.demoButton}
            onClick={() => demoRunning ? resetDemo() : startDemo()}
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
          
          <div className={styles.speedSelector}>
            <label htmlFor="speedSelect" className={styles.infoLabel}>Speed</label>
            <select 
              id="speedSelect" 
              className={styles.speedSelect}
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
        <div className={styles.activeCall}>
          <div className={styles.recordingDot}></div>
          <span>Live Interpretation</span>
        </div>
      )}

      {/* Analytics Bar */}
      <div className={styles.analyticsBar}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Call Duration</span>
            <svg className={styles.statIcon} viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 4a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 101.414-1.414L11 9.586V6z"/>
            </svg>
          </div>
          <div className={styles.statValue}>
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
          </div>
          <div className={styles.statChange}>
            <span>⏱</span>
            <span>{demoRunning ? 'Session active' : 'Ready to start'}</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Words Interpreted</span>
            <svg className={styles.statIcon} viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2 1 1 0 100-2 2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/>
            </svg>
          </div>
          <div className={styles.statValue}>{messages.length * 15}</div>
          <div className={styles.statChange}>
            <span>📝</span>
            <span>{demoRunning ? 'Processing active' : 'Waiting...'}</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Accuracy Rate</span>
            <svg className={styles.statIcon} viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
            </svg>
          </div>
          <div className={styles.statValue}>{demoRunning ? '96.2%' : '--'}</div>
          <div className={styles.statChange}>
            <span>🎯</span>
            <span>{demoRunning ? 'High accuracy' : 'Calculating...'}</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Speaking Pace</span>
            <svg className={styles.statIcon} viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
            </svg>
          </div>
          <div className={styles.statValue}>{demoRunning ? '125 WPM' : '-- WPM'}</div>
          <div className={styles.statChange}>
            <span>🗣</span>
            <span>{demoRunning ? 'Good pace' : 'Measuring...'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Chat Container */}
        <div className={styles.chatContainer}>
          <div className={styles.chatHeader}>
            <div className={styles.languagePair}>
              <div className={styles.languageFlag} style={{ background: 'var(--doctor-color)' }}>🩺</div>
              <span>Doctor</span>
              <span>⇄</span>
              <span>Patient</span>
              <div className={styles.languageFlag} style={{ background: 'var(--patient-color)' }}>👤</div>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Medical Consultation (EN ⇄ ES)
            </div>
          </div>
          
          <div className={styles.chatMessages}>
            {messages.length === 0 ? (
              <div className={styles.chatPlaceholder}>
                <svg width="60" height="60" viewBox="0 0 60 60" fill="currentColor" opacity="0.3">
                  <path d="M30 10c11.046 0 20 8.954 20 20s-8.954 20-20 20c-2.094 0-4.112-.322-6.01-.92l-7.99 2.66 2.66-7.99A19.914 19.914 0 0110 30c0-11.046 8.954-20 20-20zm0-5C16.193 5 5 16.193 5 30c0 4.368 1.12 8.474 3.087 12.04L3.93 52.303a2.5 2.5 0 003.267 3.267L17.46 51.413C21.026 53.38 25.132 54.5 29.5 54.5 44.031 54.5 56 42.531 56 28S44.031 5 30 5z"/>
                </svg>
                <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>Ready to start interpretation</p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Click &quot;Start Demo&quot; to begin the simulation</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`${styles.message} ${styles[message.type]}`}>
                  <div className={styles.messageHeader}>
                    <span className={styles.speakerName}>{message.speaker}</span>
                    <span className={styles.messageTime}>
                      {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className={styles.languageLabel}>
                    ORIGINAL ({message.originalLang.toUpperCase()})
                  </div>
                  <div className={styles.originalText}>{message.original}</div>
                  <div className={styles.languageLabel}>
                    TRANSLATION ({message.translatedLang.toUpperCase()})
                  </div>
                  <div className={styles.translationText}>{message.translation}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assistant Panel */}
        <div className={styles.assistantPanel}>
          {/* Keywords Panel */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
              </svg>
              Key Terms & Phrases
            </div>
            <div className={styles.keywordsGrid}>
              <div className={styles.keywordItem}>
                <div>
                  <div className={styles.keywordText}>Headache</div>
                  <div className={styles.keywordTranslation}>Dolor de cabeza</div>
                </div>
              </div>
              <div className={styles.keywordItem}>
                <div>
                  <div className={styles.keywordText}>Pressure</div>
                  <div className={styles.keywordTranslation}>Presión</div>
                </div>
              </div>
              <div className={styles.keywordItem}>
                <div>
                  <div className={styles.keywordText}>Temples</div>
                  <div className={styles.keywordTranslation}>Sienes</div>
                </div>
              </div>
              <div className={styles.keywordItem}>
                <div>
                  <div className={styles.keywordText}>Forehead</div>
                  <div className={styles.keywordTranslation}>Frente</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Common Phrases Panel */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"/>
              </svg>
              Suggested Phrases
            </div>
            <div>
              <div className={styles.phraseItem}>
                <div className={styles.phraseOriginal}>¿Desde cuándo tiene estos síntomas?</div>
                <div className={styles.phraseTranslation}>How long have you had these symptoms?</div>
              </div>
              <div className={styles.phraseItem}>
                <div className={styles.phraseOriginal}>¿El dolor empeora con alguna actividad?</div>
                <div className={styles.phraseTranslation}>Does the pain worsen with any activity?</div>
              </div>
              <div className={styles.phraseItem}>
                <div className={styles.phraseOriginal}>¿Ha tomado algún medicamento?</div>
                <div className={styles.phraseTranslation}>Have you taken any medication?</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper functions
  function startDemo() {
    setDemoRunning(true);
    setMessages([]);
    setSeconds(0);
    
    // Start timer
    startTimer();
    // Start adding messages
    addMessagesSequentially();
  }

  function resetDemo() {
    setDemoRunning(false);
    setMessages([]);
    setSeconds(0);
    
    // Clear intervals
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (statsInterval.current) clearInterval(statsInterval.current);
    if (performanceInterval.current) clearInterval(performanceInterval.current);
  }

  function startTimer() {
    timerInterval.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
  }

  function addMessagesSequentially() {
    let totalDelay = 0;
    
    demoMessages.forEach((msg) => {
      totalDelay += msg.delay / speedMultiplier;
      
      setTimeout(() => {
        if (!demoRunning) return;
        
        setMessages(prev => [msg, ...prev]);
      }, totalDelay);
    });
  }
}