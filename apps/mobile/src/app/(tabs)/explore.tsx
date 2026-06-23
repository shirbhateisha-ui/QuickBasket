import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useGetCategoriesQuery, useGetProductsQuery } from '@quickbasket/store';

import { CategoryChip } from '@/components/category-chip';
import { ProductCard } from '@/components/product-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CatalogScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const [categoryId, setCategoryId] = useState<string | undefined>(params.categoryId);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(20);

  const { data: categories } = useGetCategoriesQuery();
  const { data, isFetching } = useGetProductsQuery({
    categoryId,
    search: search.trim() || undefined,
    limit,
  });
  const products = data?.items ?? [];

  const selectCategory = (id: string | undefined) => {
    setCategoryId(id);
    setLimit(20);
  };

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.headerArea}>
          <TextInput
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              setLimit(20);
            }}
            placeholder="Search products"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            style={[styles.search, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            <CategoryChip
              label="All"
              selected={!categoryId}
              onPress={() => selectCategory(undefined)}
            />
            {categories?.map((c) => (
              <CategoryChip
                key={c.id}
                label={c.name}
                selected={categoryId === c.id}
                onPress={() => selectCategory(c.id)}
              />
            ))}
          </ScrollView>
        </View>

        <FlashList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              style={styles.gridItem}
              onPress={() => router.push({
                pathname: '/product/[id]',
                params: { id: item.id }
              })}
            />
          )}
          contentContainerStyle={styles.grid}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (data?.hasMore && !isFetching) setLimit((l) => l + 20);
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary">
                {isFetching ? 'Loading…' : 'No products found.'}
              </ThemedText>
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerArea: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, gap: Spacing.two },
  search: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  chips: { gap: Spacing.two, paddingVertical: Spacing.one },
  grid: { padding: Spacing.two },
  gridItem: { flex: 1, margin: Spacing.one },
  empty: { padding: Spacing.five, alignItems: 'center' },
});
