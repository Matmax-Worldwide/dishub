'use client';

import { useState, useEffect, useCallback } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface MetaMaskSolanaState {
  isConnected: boolean;
  publicKey: string | null;
  isLoading: boolean;
  error: string | null;
}

interface UseMetaMaskSolanaReturn extends MetaMaskSolanaState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  signTransaction: (operationType: string, operationData: unknown) => Promise<string>;
  getBalance: () => Promise<number>;
  sendTransaction: (to: string, amount: number) => Promise<string>;
}

// Solana RPC endpoint - puedes cambiar esto por tu endpoint preferido
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';

export function useMetaMaskSolana(): UseMetaMaskSolanaReturn {
  const [state, setState] = useState<MetaMaskSolanaState>({
    isConnected: false,
    publicKey: null,
    isLoading: false,
    error: null,
  });

  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

  // Check if MetaMask is installed and supports Solana
  const checkConnection = useCallback(async () => {
    try {
      const provider = await detectEthereumProvider();
      
      if (!provider) {
        setState(prev => ({ ...prev, error: 'MetaMask no está instalado' }));
        return;
      }

      // Check if MetaMask supports Solana
      const ethereum = provider as unknown as {
        isSolana: boolean;
        solana: boolean;
        request: (args: { method: string; params: unknown }) => Promise<unknown>;
      };
      if (!ethereum.isSolana && !ethereum.solana) {
        setState(prev => ({ ...prev, error: 'MetaMask no soporta Solana en esta versión' }));
        return;
      }

      // Try to get current Solana account
      try {
        const accounts = await ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ solana: {} }]
        });
        
        if (accounts && (accounts as string[]).length > 0) {
          setState(prev => ({
            ...prev,
            isConnected: true,
            publicKey: (accounts as string[])[0],
            error: null,
          }));
        }
      } catch {
        // User might not have connected yet, this is normal
        console.log('No Solana account connected yet');
      }
    } catch (error: unknown) {
      console.error('Error checking MetaMask Solana connection:', error);
      setState(prev => ({ ...prev, error: 'Error al verificar conexión con MetaMask Solana' }));
    }
  }, []);

  // Connect to MetaMask Solana
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const provider = await detectEthereumProvider();
      
      if (!provider) {
        throw new Error('MetaMask no está instalado. Por favor instala MetaMask para continuar.');
      }

      const ethereum = provider as unknown as {
        isSolana: boolean;
        solana: boolean;
        request: (args: { method: string; params: unknown }) => Promise<unknown>;
      };
      
      // Check if Solana is supported
      if (!ethereum.isSolana && !ethereum.solana) {
        throw new Error('Esta versión de MetaMask no soporta Solana. Por favor actualiza MetaMask.');
      }

      // Request Solana account access
      const response = await ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ solana: {} }]
      });

      if (response && (response as unknown[]).length > 0) {
        const publicKey = ((response as unknown[])[0] as { caveats: { value: string[] }[] }).caveats[0].value[0] as string;
        setState(prev => ({
          ...prev,
          isConnected: true,
          publicKey,
          isLoading: false,
          error: null,
        }));
      } else {
        throw new Error('No se pudo obtener la cuenta de Solana');
      }
    } catch (error: unknown) {
      console.error('Error connecting to MetaMask Solana:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message || 'Error al conectar con MetaMask Solana',
      }));
    }
  }, []);

  // Disconnect from MetaMask
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      publicKey: null,
      isLoading: false,
      error: null,
    });
  }, []);

  // Sign a message with MetaMask Solana
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.isConnected || !state.publicKey) {
      throw new Error('MetaMask Solana no está conectado');
    }

    try {
      const provider = await detectEthereumProvider();
      if (!provider) {
        throw new Error('MetaMask no está disponible');
      }

      const ethereum = provider as unknown as {
        request: (args: { method: string; params: unknown }) => Promise<unknown>;
      };
      
      // Convert message to Uint8Array
      const messageBytes = new TextEncoder().encode(message);
      
      const signature = await ethereum.request({
        method: 'solana_signMessage',
        params: {
          message: Array.from(messageBytes),
          display: 'utf8',
        },
      });

      return (signature as { signature: string }).signature;
    } catch (error: unknown) {
      console.error('Error signing message:', error);
      throw new Error((error as Error).message || 'Error al firmar el mensaje');
    }
  }, [state.isConnected, state.publicKey]);

  // Sign a transaction for operation approval
  const signTransaction = useCallback(async (operationType: string, operationData: unknown): Promise<string> => {
    if (!state.isConnected || !state.publicKey) {
      throw new Error('MetaMask Solana no está conectado');
    }

    try {
      // Create a structured message for the operation
      const timestamp = Date.now();
      const humanReadableMessage = `
Aprobar operación en Solana: ${operationType}
Cuenta: ${state.publicKey}
Timestamp: ${new Date(timestamp).toISOString()}
Datos: ${JSON.stringify(operationData, null, 2)}

⚠️ Solo firma si estás seguro de esta operación.
      `.trim();

      const signature = await signMessage(humanReadableMessage);
      
      return signature;
    } catch (error: unknown) {
      console.error('Error signing transaction:', error);
      throw new Error((error as Error).message || 'Error al firmar la transacción');
    }
  }, [state.isConnected, state.publicKey, signMessage]);

  // Get Solana balance
  const getBalance = useCallback(async (): Promise<number> => {
    if (!state.publicKey) {
      throw new Error('No hay cuenta conectada');
    }

    try {
      const publicKey = new PublicKey(state.publicKey);
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
    } catch (error: unknown) {
      console.error('Error getting balance:', error);
      throw new Error((error as Error).message || 'Error al obtener el balance');
    }
  }, [state.publicKey, connection]);

  // Send a Solana transaction
  const sendTransaction = useCallback(async (to: string, amount: number): Promise<string> => {
    if (!state.isConnected || !state.publicKey) {
      throw new Error('MetaMask Solana no está conectado');
    }

    try {
      const provider = await detectEthereumProvider();
      if (!provider) {
        throw new Error('MetaMask no está disponible');
      }

      const ethereum = provider as unknown as {
        request: (args: { method: string; params: unknown }) => Promise<unknown>;
      };
      const fromPublicKey = new PublicKey(state.publicKey);
      const toPublicKey = new PublicKey(to);
      
      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports: amount * LAMPORTS_PER_SOL, // Convert SOL to lamports
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPublicKey;

      // Sign and send transaction through MetaMask
      const signedTransaction = await ethereum.request({
        method: 'solana_signAndSendTransaction',
        params: {
          message: transaction.serializeMessage().toString('base64'),
        },
      });

      return (signedTransaction as { signature: string }).signature;
    } catch (error: unknown) {
      console.error('Error sending transaction:', error);
      throw new Error((error as Error).message || 'Error al enviar la transacción');
    }
  }, [state.isConnected, state.publicKey, connection]);

  // Set up event listeners
  useEffect(() => {
    const setupEventListeners = async () => {
      const provider = await detectEthereumProvider();
      if (!provider) return;

      const ethereum = provider as unknown as {
        on: (event: string, callback: (...args: unknown[]) => void) => void;
        removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      };

      const handleAccountsChanged = (accounts: unknown[]) => {
        if ((accounts as string[]).length === 0) {
          disconnect();
        } else {
          setState(prev => ({ ...prev, publicKey: (accounts as string[])[0] as string }));
        }
      };

      const handleDisconnect = () => {
        disconnect();
      };

      // Listen for Solana account changes
      if (ethereum.on) {
        ethereum.on('accountsChanged', handleAccountsChanged as (...args: unknown[]) => void);
        ethereum.on('disconnect', handleDisconnect);
      }

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged as (...args: unknown[]) => void);
          ethereum.removeListener('disconnect', handleDisconnect);
        }
      };
    };

    setupEventListeners();
    checkConnection();
  }, [checkConnection, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    signTransaction,
    getBalance,
    sendTransaction,
  };
} 