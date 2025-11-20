import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import useWalletStore from '../store/walletStore';
import {
  loadEncryptedMnemonic,
  decryptMnemonicAny,
  encryptMnemonicV2,
  isMigrationNeeded,
  storeEncryptedMnemonic
} from '../utils/secureStorage';

function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const wallet = useWalletStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [changing, setChanging] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const [language, setLanguage] = useState(wallet.language);
  const [themeMode, setThemeMode] = useState(wallet.themeMode);
  const [autoLock, setAutoLock] = useState(wallet.autoLockMinutes);

  useEffect(() => {
    wallet.actions.initializePreferences?.();
  }, []);

  const applyLanguage = (lng: string) => {
    if (lng === 'auto') {
      const nav = typeof navigator !== 'undefined' && navigator.language.startsWith('fr') ? 'fr' : 'en';
      i18n.changeLanguage(nav);
      wallet.actions.setLanguage('auto');
      localStorage.setItem('wallet.lang.override', 'auto');
    } else {
      i18n.changeLanguage(lng);
      wallet.actions.setLanguage(lng);
      localStorage.setItem('wallet.lang.override', lng);
    }
    setLanguage(lng);
    Toast.show({ type: 'success', text1: t('settings.select_language'), text2: lng });
  };

  const applyTheme = (mode: string) => {
    wallet.actions.setThemeMode(mode);
    setThemeMode(mode);
    Toast.show({ type: 'success', text1: t('settings.theme_mode'), text2: mode });
  };

  const applyAutoLock = (m: number) => {
    wallet.actions.setAutoLock(m);
    setAutoLock(m);
    Toast.show({ type: 'success', text1: t('settings.auto_lock'), text2: m === 0 ? 'Off' : m + 'm' });
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || newPassword !== confirm) {
      Toast.show({ type: 'error', text1: t('settings.password_change'), text2: 'Invalid input' });
      return;
    }
    setChanging(true);
    try {
      const payload = loadEncryptedMnemonic();
      if (!payload) throw new Error('No payload');
      const mnemonic = await decryptMnemonicAny(payload, oldPassword);
      const newP = await encryptMnemonicV2(mnemonic, newPassword);
      storeEncryptedMnemonic(newP);
      Toast.show({ type: 'success', text1: t('wallet.password_changed') });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: t('settings.password_change'), text2: e.message });
    } finally {
      setChanging(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const payload = loadEncryptedMnemonic();
      if (!payload || !isMigrationNeeded(payload)) {
        Toast.show({ type: 'info', text1: t('settings.encryption_status'), text2: 'Up to date' });
        return;
      }
      if (!oldPassword) {
        Toast.show({ type: 'error', text1: 'Password required' });
        return;
      }
      const mnemonic = await decryptMnemonicAny(payload, oldPassword);
      const newPayload = await encryptMnemonicV2(mnemonic, oldPassword);
      storeEncryptedMnemonic(newPayload);
      Toast.show({ type: 'success', text1: t('wallet.encryption_migrated') });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: t('settings.migrate_encryption'), text2: e.message });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      <Section title={t('settings.language')}>
        <Row>
          <Option label={t('settings.auto_detect')} active={language === 'auto'} onPress={() => applyLanguage('auto')} />
          <Option label="FR" active={language === 'fr'} onPress={() => applyLanguage('fr')} />
          <Option label="EN" active={language === 'en'} onPress={() => applyLanguage('en')} />
        </Row>
      </Section>

      <Section title={t('settings.appearance')}>
        <Row>
          <Option label={t('settings.system')} active={themeMode === 'system'} onPress={() => applyTheme('system')} />
          <Option label={t('settings.dark')} active={themeMode === 'dark'} onPress={() => applyTheme('dark')} />
          <Option label={t('settings.light')} active={themeMode === 'light'} onPress={() => applyTheme('light')} />
        </Row>
      </Section>

      <Section title={t('settings.auto_lock')}>
        <Row>
          {[0,1,5,15].map(m => (
            <Option key={m} label={m === 0 ? 'Off' : m + 'm'} active={autoLock === m} onPress={() => applyAutoLock(m)} />
          ))}
        </Row>
      </Section>

      <Section title={t('settings.security')}>
        <Text style={styles.label}>{t('settings.old_password')}</Text>
        <TextInput style={styles.input} secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
        <Text style={styles.label}>{t('settings.new_password')}</Text>
        <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
        <Text style={styles.label}>{t('settings.confirm_password')}</Text>
        <TextInput style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm} />
        <TouchableOpacity style={styles.button} onPress={handlePasswordChange} disabled={changing}>
          <Text style={styles.buttonText}>{changing ? '...' : t('settings.password_change')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, migrating && styles.buttonDisabled]} onPress={handleMigrate} disabled={migrating}>
          <Text style={styles.buttonText}>{t('settings.migrate_encryption')}</Text>
        </TouchableOpacity>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Option({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.option, active && styles.optionActive]} onPress={onPress}>
      <Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#24272A' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#8B92A6', marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  option: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24,
    backgroundColor: '#141618', borderWidth: 1, borderColor: '#3C4043',
    marginRight: 10, marginBottom: 10
  },
  optionActive: { backgroundColor: '#037DD6', borderColor: '#037DD6' },
  optionText: { color: '#8B92A6', fontSize: 12, fontWeight: '600' },
  optionTextActive: { color: '#FFFFFF' },
  label: { color: '#D6D9DC', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#141618', borderRadius: 8, padding: 12,
    color: '#FFFFFF', marginBottom: 12, borderWidth: 1, borderColor: '#3C4043'
  },
  button: {
    backgroundColor: '#037DD6', paddingVertical: 12, borderRadius: 30,
    alignItems: 'center', marginBottom: 12
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});

export default SettingsScreen;
