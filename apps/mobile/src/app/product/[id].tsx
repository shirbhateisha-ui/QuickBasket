import { Alert, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetProductByIdQuery } from '@quickbasket/store';
import { formatPrice } from '@quickbasket/utils';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { data: product, isLoading, isError } = useGetProductByIdQuery(id);

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          Loading…
        </ThemedText>
      </ThemedView>
    );
  }

  if (isError || !product) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          Product not found.
        </ThemedText>
      </ThemedView>
    );
  }

  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 3;

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {(product.images.length ? product.images : ['']).map((uri, i) => (
            <Image
              key={`${uri}-${i}`}
              source={uri ? { uri } : undefined}
              style={{ width, height: width }}
              contentFit="cover"
              transition={150}
            />
          ))}
        </ScrollView>

        <View style={styles.body}>
          <ThemedText type="subtitle">{product.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {product.unit}
          </ThemedText>

          <View style={styles.priceRow}>
            <ThemedText type="title" style={styles.price}>
              {formatPrice(product.price)}
            </ThemedText>
            {product.mrp > product.price ? (
              <>
                <ThemedText type="small" themeColor="textSecondary" style={styles.mrp}>
                  {formatPrice(product.mrp)}
                </ThemedText>
                <ThemedText type="smallBold" style={styles.discount}>
                  {product.discountPercent}% OFF
                </ThemedText>
              </>
            ) : null}
          </View>

          {outOfStock ? (
            <ThemedText type="smallBold" style={styles.outOfStock}>
              Out of stock
            </ThemedText>
          ) : lowStock ? (
            <ThemedText type="small" style={styles.lowStock}>
              Only {product.stock} left
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              In stock
            </ThemedText>
          )}

          {product.description ? (
            <ThemedText type="default" style={styles.description}>
              {product.description}
            </ThemedText>
          ) : null}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={[styles.footer, { borderTopColor: theme.backgroundSelected }]}>
        <Pressable
          disabled={outOfStock}
          onPress={() => Alert.alert('Cart', 'Cart & checkout arrive in Phase 3.')}
          style={[styles.addButton, outOfStock && styles.addButtonDisabled]}>
          <ThemedText type="smallBold" style={styles.addButtonText}>
            {outOfStock ? 'Out of stock' : 'Add to cart'}
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: Spacing.four },
  body: { padding: Spacing.three, gap: Spacing.two },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two, marginTop: Spacing.one },
  price: { fontSize: 32, lineHeight: 36 },
  mrp: { textDecorationLine: 'line-through' },
  discount: { color: '#0a8f3c' },
  outOfStock: { color: '#e5484d' },
  lowStock: { color: '#d9730d' },
  description: { marginTop: Spacing.two },
  footer: { borderTopWidth: 1, padding: Spacing.three },
  addButton: {
    backgroundColor: '#208AEF',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { color: '#ffffff' },
});
