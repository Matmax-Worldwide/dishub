'use client';

import React, { useState } from 'react';
import { useMetaMaskSolana } from '@/hooks/useMetaMask';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Wallet, CheckCircle, XCircle } from 'lucide-react';

interface MetaMaskApprovalProps {
  operationType: string;
  operationData: unknown;
  operationDescription: string;
  onApproval: (signature: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MetaMaskApproval({
  operationType,
  operationData,
  operationDescription,
  onApproval,
  onCancel,
  isLoading = false
}: MetaMaskApprovalProps) {
  const {
    isConnected,
    publicKey,
    connect,
    signTransaction,
    error: metaMaskError,
    isLoading: metaMaskLoading
  } = useMetaMaskSolana();

  const [approvalState, setApprovalState] = useState<'idle' | 'signing' | 'success' | 'error'>('idle');
  const [signature, setSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      setErrorMessage('Error al conectar con MetaMask');
    }
  };

  const handleApprove = async () => {
    if (!isConnected) {
      setErrorMessage('MetaMask no está conectado');
      return;
    }

    setApprovalState('signing');
    setErrorMessage(null);

    try {
      const sig = await signTransaction(operationType, operationData);
      setSignature(sig);
      setApprovalState('success');
      onApproval(sig);
    } catch (error: unknown) {
      console.error('Error signing transaction:', error);
      setErrorMessage((error as Error).message || 'Error al firmar la transacción');
      setApprovalState('error');
    }
  };

  const handleCancel = () => {
    setApprovalState('idle');
    setSignature(null);
    setErrorMessage(null);
    onCancel();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Shield className="h-12 w-12 text-orange-500" />
        </div>
        <CardTitle className="text-xl font-bold">
          Aprobación Requerida
        </CardTitle>
        <CardDescription>
          Esta operación requiere aprobación con MetaMask para mayor seguridad
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Operation Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">
            Operación a aprobar:
          </h4>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Tipo:</strong> {operationType}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Descripción:</strong> {operationDescription}
          </p>
        </div>

        {/* MetaMask Connection Status */}
        {!isConnected ? (
          <div className="space-y-3">
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                Necesitas conectar MetaMask para continuar
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleConnect} 
              disabled={metaMaskLoading}
              className="w-full"
            >
              {metaMaskLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Conectar MetaMask
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                MetaMask conectado: {publicKey?.substring(0, 8)}...{publicKey?.substring(-8)}
              </AlertDescription>
            </Alert>

            {/* Approval Actions */}
            {approvalState === 'idle' && (
              <div className="flex space-x-2">
                <Button 
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Aprobar con MetaMask
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            )}

            {approvalState === 'signing' && (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-orange-500" />
                <p className="text-sm text-gray-600">
                  Firmando transacción en MetaMask...
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Por favor revisa y confirma en tu wallet
                </p>
              </div>
            )}

            {approvalState === 'success' && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm text-green-600 font-semibold">
                  ¡Operación aprobada exitosamente!
                </p>
                {signature && (
                  <p className="text-xs text-gray-500 mt-2 break-all">
                    Firma: {signature.substring(0, 20)}...
                  </p>
                )}
              </div>
            )}

            {approvalState === 'error' && (
              <div className="text-center py-4">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-sm text-red-600 font-semibold">
                  Error en la aprobación
                </p>
                <Button 
                  onClick={() => setApprovalState('idle')}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Intentar de nuevo
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Error Messages */}
        {(metaMaskError || errorMessage) && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage || metaMaskError}
            </AlertDescription>
          </Alert>
        )}

        {/* Security Notice */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>🔒 Nota de seguridad:</strong> Solo firma si estás seguro de esta operación. 
            La firma de MetaMask proporciona una capa adicional de seguridad para operaciones críticas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook personalizado para usar MetaMask approval en operaciones críticas
export function useMetaMaskApproval() {
  const [isApprovalRequired, setIsApprovalRequired] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<{
    type: string;
    data: unknown;
    description: string;
    onApproval: (signature: string) => void;
    onCancel: () => void;
  } | null>(null);

  const requestApproval = (
    operationType: string,
    operationData: unknown,
    operationDescription: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      setCurrentOperation({
        type: operationType,
        data: operationData,
        description: operationDescription,
        onApproval: (signature: string) => {
          setIsApprovalRequired(false);
          setCurrentOperation(null);
          resolve(signature);
        },
        onCancel: () => {
          setIsApprovalRequired(false);
          setCurrentOperation(null);
          reject(new Error('Operación cancelada por el usuario'));
        }
      });
      setIsApprovalRequired(true);
    });
  };

  const ApprovalModal = () => {
    if (!isApprovalRequired || !currentOperation) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <MetaMaskApproval
          operationType={currentOperation.type}
          operationData={currentOperation.data}
          operationDescription={currentOperation.description}
          onApproval={currentOperation.onApproval}
          onCancel={currentOperation.onCancel}
        />
      </div>
    );
  };

  return {
    requestApproval,
    ApprovalModal,
    isApprovalRequired
  };
} 