import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Mock Data
const MOCK_MARKET = [
  { id: '1', name: 'Bitcoin', symbol: 'BTC', price: '$42,340.50', change: '+2.4%', up: true },
  { id: '2', name: 'Ethereum', symbol: 'ETH', price: '$2,230.15', change: '+1.2%', up: true },
  { id: '3', name: 'Solana', symbol: 'SOL', price: '$95.20', change: '-3.5%', up: false },
  { id: '4', name: 'Cardano', symbol: 'ADA', price: '$0.55', change: '+0.5%', up: true },
];

const MOCK_NEWS = [
  { id: '1', title: 'Le Bitcoin atteint un nouveau sommet mensuel', source: 'CryptoDaily', time: '2h' },
  { id: '2', title: 'Malin Wallet lance sa nouvelle IA révolutionnaire', source: 'TechNews', time: '4h' },
  { id: '3', title: 'Les NFTs font leur grand retour en 2024', source: 'ArtBlock', time: '6h' },
];

export default function MarketScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
       <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marché & Actus</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Tendance Marché</Text>
        {MOCK_MARKET.map((coin) => (
            <View key={coin.id} style={styles.marketItem}>
                <View style={styles.coinInfo}>
                    <View style={styles.coinIcon}>
                        <Text style={styles.coinIconText}>{coin.symbol[0]}</Text>
                    </View>
                    <View>
                        <Text style={styles.coinName}>{coin.name}</Text>
                        <Text style={styles.coinSymbol}>{coin.symbol}</Text>
                    </View>
                </View>
                <View style={styles.priceInfo}>
                    <Text style={styles.price}>{coin.price}</Text>
                    <Text style={[styles.change, { color: coin.up ? theme.colors.success : theme.colors.error }]}>
                        {coin.change}
                    </Text>
                </View>
            </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Actualités Crypto</Text>
        {MOCK_NEWS.map((news) => (
             <TouchableOpacity key={news.id} style={styles.newsItem}>
                <View style={styles.newsContent}>
                    <Text style={styles.newsTitle}>{news.title}</Text>
                    <View style={styles.newsMeta}>
                        <Text style={styles.newsSource}>{news.source}</Text>
                        <Text style={styles.newsTime}>• {news.time}</Text>
                    </View>
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 16 },

  marketItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant },
  coinInfo: { flexDirection: 'row', alignItems: 'center' },
  coinIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  coinIconText: { fontSize: 16, color: theme.colors.text, fontWeight: 'bold' },
  coinName: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  coinSymbol: { fontSize: 12, color: theme.colors.secondary },
  priceInfo: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  change: { fontSize: 12, fontWeight: '500' },

  newsItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: theme.colors.surface, borderRadius: 12, marginBottom: 12 },
  newsContent: { flex: 1, marginRight: 8 },
  newsTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 6 },
  newsMeta: { flexDirection: 'row' },
  newsSource: { fontSize: 12, color: theme.colors.primary, fontWeight: 'bold', marginRight: 6 },
  newsTime: { fontSize: 12, color: theme.colors.secondary },
});
