import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Mock Data
const MOCK_NFTS = [
  { id: '1', name: 'Malin Punk #001', collection: 'Malin Punks', imageUrl: 'https://via.placeholder.com/150/6C63FF/FFFFFF?text=MP+001' },
  { id: '2', name: 'Crypto Art #42', collection: 'Abstract Minds', imageUrl: 'https://via.placeholder.com/150/00E5FF/000000?text=Art+42' },
  { id: '3', name: 'Space Doge', collection: 'Meme World', imageUrl: 'https://via.placeholder.com/150/FFD740/000000?text=Doge' },
  { id: '4', name: 'Neon City Key', collection: 'Metaverse Items', imageUrl: 'https://via.placeholder.com/150/FF5252/FFFFFF?text=Key' },
];

export default function NftGalleryScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = getStyles(theme);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.cardContent}>
        <Text style={styles.collectionName}>{item.collection}</Text>
        <Text style={styles.nftName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes NFTs</Text>
      </View>

      <FlatList
        data={MOCK_NFTS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  listContent: { padding: 8 },
  card: { flex: 1, margin: 8, backgroundColor: theme.colors.surface, borderRadius: 16, overflow: 'hidden', elevation: 2 },
  image: { width: '100%', height: 150, backgroundColor: theme.colors.surfaceVariant },
  cardContent: { padding: 12 },
  collectionName: { fontSize: 10, color: theme.colors.secondary, textTransform: 'uppercase', marginBottom: 4 },
  nftName: { fontSize: 14, fontWeight: 'bold', color: theme.colors.text },
});
