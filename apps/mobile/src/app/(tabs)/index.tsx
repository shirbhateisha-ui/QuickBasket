import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  selectCurrentUser,
  useGetCategoriesQuery,
  useGetProductsQuery,
} from '@quickbasket/store';

import { CategoryChip } from '@/components/category-chip';
import { ProductCard } from '@/components/product-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logout } from '@/lib/auth';
import { useAppSelector } from '@/store';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const user = useAppSelector(selectCurrentUser);
  const { data: categories } = useGetCategoriesQuery();
  const { data: featured } = useGetProductsQuery({ featured: true, limit: 10 });

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">
                Hi {user?.name ?? 'there'} 👋
              </ThemedText>
              <ThemedText type="subtitle">QuickBasket</ThemedText>
            </View>
            <Pressable onPress={() => logout()}>
              <ThemedText type="linkPrimary">Log out</ThemedText>
            </Pressable>
          </View>

          <View style={[styles.banner, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold">Fresh groceries, delivered</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Free delivery on orders over ₹999
            </ThemedText>
          </View>

          <ThemedText type="smallBold">Shop by category</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            {categories?.map((c) => (
              <CategoryChip
                key={c.id}
                label={c.name}
                onPress={() => router.push({
                  pathname: '/explore',
                  params: { categoryId: c.id }
                })}
              />
            ))}
          </ScrollView>

          <ThemedText type="smallBold">Featured</ThemedText>
          <View style={styles.grid}>
            {featured?.items.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                style={styles.gridItem}
                onPress={() => router.push({
                  pathname: '/product/[id]',
                  params: { id: p.id }
                })}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  banner: { padding: Spacing.three, borderRadius: Spacing.two, gap: 2 },
  chips: { gap: Spacing.two, paddingVertical: Spacing.one },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  gridItem: { width: '48%' },
});
