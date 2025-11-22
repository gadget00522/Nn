import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import useWalletStore from '../store/walletStore';
import WalletConnectService from '../services/WalletConnectService';

/**
 * Composant Modal pour gérer les requêtes WalletConnect.
 * Affiche une fenêtre modale pour approuver ou rejeter les propositions de session
 * et les demandes de signature/transaction provenant de DApps externes.
 * S'abonne à l'état `walletConnectRequest` du store.
 *
 * @returns {JSX.Element | null} Le composant modal ou null si aucune requête active.
 */
function WalletConnectModal() {
  const walletConnectRequest = useWalletStore((state) => state.walletConnectRequest);
  const approveSession = useWalletStore((state) => state.actions.approveSession);
  const rejectSession = useWalletStore((state) => state.actions.rejectSession);
  const approveRequest = useWalletStore((state) => state.actions.approveRequest);
  const rejectRequest = useWalletStore((state) => state.actions.rejectRequest);
  const setWalletConnectRequest = useWalletStore((state) => state.actions.setWalletConnectRequest);
  const clearWalletConnectRequest = useWalletStore((state) => state.actions.clearWalletConnectRequest);

  /**
   * Initialise le service WalletConnect et configure les écouteurs d'événements.
   */
  useEffect(() => {
    // Initialize WalletConnect and set up event listeners
    const initWalletConnect = async () => {
      try {
        const wcService = WalletConnectService.getInstance();
        
        // Initialize if not already done
        if (!wcService.isInitialized()) {
          await wcService.initialize();
        }

        // Listen for session proposals
        wcService.on('session_proposal', (proposal: any) => {
          console.log('Session proposal received in modal:', proposal);
          setWalletConnectRequest({
            type: 'session_proposal',
            id: proposal.id,
            params: proposal.params,
            verifyContext: proposal.verifyContext,
          });
        });

        // Listen for session requests (sign, transactions, etc.)
        wcService.on('session_request', (request: any) => {
          console.log('Session request received in modal:', request);
          setWalletConnectRequest({
            type: 'session_request',
            topic: request.topic,
            id: request.id,
            params: request.params,
          });
        });

        // Listen for session deletions
        wcService.on('session_delete', (session: any) => {
          console.log('Session deleted:', session);
          clearWalletConnectRequest();
        });
      } catch (error) {
        console.error('Failed to initialize WalletConnect in modal:', error);
      }
    };

    initWalletConnect();
  }, [setWalletConnectRequest, clearWalletConnectRequest]);

  /**
   * Approuve la requête ou la session en cours.
   */
  const handleApprove = async () => {
    try {
      if (walletConnectRequest?.type === 'session_proposal') {
        await approveSession();
      } else if (walletConnectRequest?.type === 'session_request') {
        await approveRequest();
      }
    } catch (error: any) {
      console.error('Failed to approve:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  /**
   * Rejette la requête ou la session en cours.
   */
  const handleReject = async () => {
    try {
      if (walletConnectRequest?.type === 'session_proposal') {
        await rejectSession();
      } else if (walletConnectRequest?.type === 'session_request') {
        await rejectRequest();
      }
    } catch (error: any) {
      console.error('Failed to reject:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  if (!walletConnectRequest) {
    return null;
  }

  // Render session proposal
  if (walletConnectRequest.type === 'session_proposal') {
    const { params } = walletConnectRequest;
    const dappName = params?.proposer?.metadata?.name || 'DApp Inconnue';
    const dappUrl = params?.proposer?.metadata?.url || 'URL inconnue';
    const dappDescription = params?.proposer?.metadata?.description || '';
    const dappIcon = params?.proposer?.metadata?.icons?.[0];

    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={handleReject}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Demande de Connexion</Text>
            
            {/* DApp Info */}
            <View style={styles.dappInfo}>
              {dappIcon && (
                <View style={styles.dappIconContainer}>
                  <Text style={styles.dappIconPlaceholder}>🔗</Text>
                </View>
              )}
              <Text style={styles.dappName}>{dappName}</Text>
              <Text style={styles.dappUrl}>{dappUrl}</Text>
              {dappDescription && (
                <Text style={styles.dappDescription}>{dappDescription}</Text>
              )}
            </View>

            {/* Permissions */}
            <View style={styles.permissionsSection}>
              <Text style={styles.permissionsTitle}>Cette DApp demande:</Text>
              <View style={styles.permissionItem}>
                <Text style={styles.permissionIcon}>✓</Text>
                <Text style={styles.permissionText}>Voir votre adresse de portefeuille</Text>
              </View>
              <View style={styles.permissionItem}>
                <Text style={styles.permissionIcon}>✓</Text>
                <Text style={styles.permissionText}>Demander l'approbation des transactions</Text>
              </View>
            </View>

            {/* Warning */}
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Assurez-vous de faire confiance à cette DApp avant de vous connecter.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={handleReject}
              >
                <Text style={styles.rejectButtonText}>Rejeter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.approveButton]}
                onPress={handleApprove}
              >
                <Text style={styles.approveButtonText}>Approuver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Render session request (sign transaction/message)
  if (walletConnectRequest.type === 'session_request') {
    const { params } = walletConnectRequest;
    const method = params?.request?.method || 'unknown';
    const chainId = params?.chainId;

    // Determine request type
    let requestTitle = 'Demande de Signature';
    let requestDescription = 'Cette DApp demande de signer quelque chose.';
    let requestDetails = '';

    if (method === 'eth_sendTransaction' || method === 'eth_signTransaction') {
      requestTitle = 'Demande de Transaction';
      requestDescription = 'Cette DApp demande d\'approuver une transaction.';
      const txParams = params?.request?.params?.[0];
      if (txParams) {
        requestDetails = `À: ${txParams.to || 'N/A'}\nValeur: ${txParams.value || '0'} Wei`;
      }
    } else if (method === 'personal_sign' || method === 'eth_sign') {
      requestTitle = 'Demande de Signature de Message';
      requestDescription = 'Cette DApp demande de signer un message.';
      const message = params?.request?.params?.[0] || params?.request?.params?.[1];
      if (message) {
        requestDetails = `Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`;
      }
    } else if (method === 'eth_signTypedData' || method === 'eth_signTypedData_v4') {
      requestTitle = 'Demande de Signature de Données Typées';
      requestDescription = 'Cette DApp demande de signer des données structurées.';
    }

    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={handleReject}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{requestTitle}</Text>

            <View style={styles.requestInfo}>
              <Text style={styles.requestDescription}>{requestDescription}</Text>
              {chainId && (
                <Text style={styles.requestChainId}>Réseau: {chainId}</Text>
              )}
              {requestDetails && (
                <View style={styles.requestDetailsBox}>
                  <Text style={styles.requestDetailsText}>{requestDetails}</Text>
                </View>
              )}
            </View>

            {/* Warning */}
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Vérifiez les détails avant d'approuver. Les transactions ne peuvent pas être annulées.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={handleReject}
              >
                <Text style={styles.rejectButtonText}>Rejeter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.approveButton]}
                onPress={handleApprove}
              >
                <Text style={styles.approveButtonText}>Approuver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  dappInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dappIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dappIconPlaceholder: {
    fontSize: 30,
  },
  dappName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dappUrl: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  dappDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  permissionsSection: {
    marginBottom: 20,
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionIcon: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 10,
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  requestInfo: {
    marginBottom: 20,
  },
  requestDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  requestChainId: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 12,
  },
  requestDetailsBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginTop: 8,
  },
  requestDetailsText: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rejectButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#007AFF',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WalletConnectModal;
