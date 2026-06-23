import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Product } from '@quickbasket/types';
import { formatPrice } from '@quickbasket/utils';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  product: Product;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ProductCard({ product, onPress, style }: Props) {
  const theme = useTheme();
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 3;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.backgroundElement }, style]}>
      <View style={styles.imageWrap}>
        <Image
          source={product.images[0] ? { uri: product.images[0] } : undefined}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
        {product.discountPercent > 0 ? (
          <View style={styles.discountBadge}>
            <ThemedText type="small" style={styles.badgeText}>
              {product.discountPercent}% OFF
            </ThemedText>
          </View>
        ) : null}
        {outOfStock ? (
          <View style={styles.outOfStock}>
            <ThemedText type="smallBold" style={styles.outOfStockText}>
              Out of stock
            </ThemedText>
          </View>
        ) : null}
      </View>

      <ThemedText type="small" numberOfLines={2} style={styles.name}>
        {product.name}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {product.unit}
      </ThemedText>

      <View style={styles.priceRow}>
        <ThemedText type="smallBold">{formatPrice(product.price)}</ThemedText>
        {product.mrp > product.price ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.mrp}>
            {formatPrice(product.mrp)}
          </ThemedText>
        ) : null}
      </View>

      {lowStock ? (
        <ThemedText type="small" style={styles.lowStock}>
          Only {product.stock} left
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.two, borderRadius: Spacing.two, gap: 2 },
  imageWrap: { position: 'relative', marginBottom: Spacing.one },
  image: { width: '100%', aspectRatio: 1, borderRadius: Spacing.one, backgroundColor: '#00000010' },
  discountBadge: {
    position: 'absolute',
    top: Spacing.one,
    left: Spacing.one,
    backgroundColor: '#0a8f3c',
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
    borderRadius: Spacing.half,
  },
  badgeText: { color: '#ffffff', fontSize: 11 },
  outOfStock: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000066',
    borderRadius: Spacing.one,
  },
  outOfStockText: { color: '#ffffff' },
  name: { minHeight: 40 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.one, marginTop: 2 },
  mrp: { textDecorationLine: 'line-through' },
  lowStock: { color: '#d9730d' },
});
