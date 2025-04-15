"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { collection, query, getDocs, limit } from "firebase/firestore"
import { db } from "../firebase/config"
import AsyncStorage from "@react-native-async-storage/async-storage"

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const [loading, setLoading] = useState(false)
  const [showRecent, setShowRecent] = useState(true)
  const [inputFocused, setInputFocused] = useState(false)

  // Animation values
  const [animatedValue] = useState(new Animated.Value(0))

  // Debounce function to prevent too many API calls
  const debounce = (func, delay) => {
    let timeoutId
    return function (...args) {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(this, args)
      }, delay)
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((text) => {
      if (text.trim().length > 0) {
        searchProducts(text)
      } else {
        setSearchResults([])
        setShowRecent(true)
      }
    }, 500),
    [],
  )

  // Lấy lịch sử tìm kiếm khi màn hình được tải
  useEffect(() => {
    loadRecentSearches()

    // Animation when component mounts
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [])

  // Theo dõi sự thay đổi của searchQuery để tìm kiếm theo thời gian thực
  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery])

  // Lưu lịch sử tìm kiếm vào AsyncStorage
  const saveRecentSearch = async (query) => {
    try {
      // Không lưu chuỗi rỗng
      if (!query.trim()) return

      // Lấy lịch sử tìm kiếm hiện tại
      const recentSearchesJSON = await AsyncStorage.getItem("recentSearches")
      let searches = recentSearchesJSON ? JSON.parse(recentSearchesJSON) : []

      // Xóa từ khóa nếu đã tồn tại (để thêm lại vào đầu danh sách)
      searches = searches.filter((item) => item.toLowerCase() !== query.toLowerCase())

      // Thêm từ khóa mới vào đầu danh sách
      searches.unshift(query)

      // Giới hạn chỉ lưu 5 từ khóa gần nhất
      searches = searches.slice(0, 5)

      // Lưu lại vào AsyncStorage
      await AsyncStorage.setItem("recentSearches", JSON.stringify(searches))

      // Cập nhật state
      setRecentSearches(searches)
    } catch (error) {
      console.error("Error saving recent search:", error)
    }
  }

  // Tải lịch sử tìm kiếm từ AsyncStorage
  const loadRecentSearches = async () => {
    try {
      const recentSearchesJSON = await AsyncStorage.getItem("recentSearches")
      if (recentSearchesJSON) {
        const searches = JSON.parse(recentSearchesJSON)
        setRecentSearches(searches)
      }
    } catch (error) {
      console.error("Error loading recent searches:", error)
    }
  }

  // Xóa một từ khóa khỏi lịch sử tìm kiếm
  const removeRecentSearch = async (queryToRemove) => {
    try {
      const recentSearchesJSON = await AsyncStorage.getItem("recentSearches")
      if (recentSearchesJSON) {
        let searches = JSON.parse(recentSearchesJSON)
        searches = searches.filter((item) => item !== queryToRemove)
        await AsyncStorage.setItem("recentSearches", JSON.stringify(searches))
        setRecentSearches(searches)
      }
    } catch (error) {
      console.error("Error removing recent search:", error)
    }
  }

  // Tìm kiếm sản phẩm từ Firestore
  const searchProducts = async (searchText) => {
    if (!searchText.trim()) {
      setSearchResults([])
      setShowRecent(true)
      return
    }

    setLoading(true)
    setShowRecent(false)

    try {
      // Tạo query tìm kiếm sản phẩm có tên chứa từ khóa tìm kiếm
      const productsRef = collection(db, "products")

      // Chuyển đổi searchText thành chữ thường để tìm kiếm không phân biệt hoa thường
      const searchTextLower = searchText.toLowerCase()

      // Lấy tất cả sản phẩm và lọc ở client để có kết quả chính xác hơn
      const allProductsQuery = query(productsRef, limit(100))
      const allProductsSnapshot = await getDocs(allProductsQuery)

      const results = allProductsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((product) => product.name && product.name.toLowerCase().includes(searchTextLower))
        .slice(0, 10) // Giới hạn 10 kết quả

      setSearchResults(results)

      // Lưu từ khóa tìm kiếm vào lịch sử nếu người dùng đã nhấn Enter hoặc nút tìm kiếm
      if (searchText.trim() && !showRecent) {
        saveRecentSearch(searchText)
      }
    } catch (error) {
      console.error("Error searching products:", error)
    } finally {
      setLoading(false)
    }
  }

  // Xử lý khi người dùng nhấn nút tìm kiếm
  const handleSearch = () => {
    Keyboard.dismiss()
    if (searchQuery.trim()) {
      searchProducts(searchQuery)
      saveRecentSearch(searchQuery)
    }
  }

  // Xử lý khi người dùng chọn một từ khóa từ lịch sử tìm kiếm
  const handleSelectRecentSearch = (query) => {
    setSearchQuery(query)
    searchProducts(query)
  }

  // Xử lý khi người dùng xóa nội dung tìm kiếm
  const handleClearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowRecent(true)
  }

  // Render item cho danh sách kết quả tìm kiếm
  const renderSearchResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.resultImage} resizeMode="cover" />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.resultPrice}>{item.price?.toLocaleString("vi-VN")}đ</Text>
        <Text style={styles.resultStock}>Còn {item.stock || 0} sp</Text>
      </View>
    </TouchableOpacity>
  )

  // Render item cho danh sách lịch sử tìm kiếm
  const renderRecentSearchItem = ({ item }) => (
    <View style={styles.recentSearchItem}>
      <TouchableOpacity style={styles.recentSearchContent} onPress={() => handleSelectRecentSearch(item)}>
        <Feather name="clock" size={20} color="#8b8b8b" style={styles.recentSearchIcon} />
        <Text style={styles.recentSearchText}>{item}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeRecentSearch(item)}>
        <Feather name="x" size={20} color="#8b8b8b" />
      </TouchableOpacity>
    </View>
  )

  // Animation styles
  const searchBarWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["90%", "100%"],
  })

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TÌM KIẾM</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <Animated.View style={[styles.searchBarContainer, { width: searchBarWidth }]}>
          <View
            style={[
              styles.searchBar,
              inputFocused && styles.searchBarFocused,
              searchQuery.length > 0 && styles.searchBarActive,
            ]}
          >
            <Feather name="search" size={20} color={inputFocused ? "#009245" : "#8b8b8b"} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm"
              placeholderTextColor="#8b8b8b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => {
                setInputFocused(true)
                Animated.timing(animatedValue, {
                  toValue: 0.95,
                  duration: 200,
                  useNativeDriver: false,
                }).start()
              }}
              onBlur={() => {
                setInputFocused(false)
                Animated.timing(animatedValue, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: false,
                }).start()
              }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                <Feather name="x-circle" size={18} color="#8b8b8b" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#009245" />
          </View>
        ) : showRecent ? (
          // Hiển thị lịch sử tìm kiếm
          <View style={styles.recentSearchesContainer}>
            <Text style={styles.recentSearchesTitle}>Tìm kiếm gần đây</Text>
            {recentSearches.length > 0 ? (
              <FlatList
                data={recentSearches.slice(0, 2)} // Chỉ hiển thị 2 từ khóa gần nhất
                renderItem={renderRecentSearchItem}
                keyExtractor={(item, index) => `recent-${index}`}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noRecentSearches}>Không có tìm kiếm gần đây</Text>
            )}
          </View>
        ) : (
          // Hiển thị kết quả tìm kiếm
          <View style={styles.resultsContainer}>
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResultItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsList}
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <Feather name="search" size={50} color="#e0e0e0" />
                <Text style={styles.noResultsText}>Không tìm thấy sản phẩm nào</Text>
                <Text style={styles.noResultsSubText}>Thử tìm kiếm với từ khóa khác</Text>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBarFocused: {
    borderColor: "#009245",
    shadowColor: "#009245",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  searchBarActive: {
    borderColor: "#009245",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#000",
  },
  clearButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recentSearchesContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000",
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  recentSearchContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recentSearchIcon: {
    marginRight: 10,
  },
  recentSearchText: {
    fontSize: 16,
    color: "#000",
  },
  noRecentSearches: {
    fontSize: 16,
    color: "#8b8b8b",
    marginTop: 10,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsList: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: "row",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  resultImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginRight: 15,
  },
  resultInfo: {
    flex: 1,
    justifyContent: "center",
  },
  resultName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
    color: "#000",
    lineHeight: 22,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#009245",
    marginBottom: 5,
  },
  resultStock: {
    fontSize: 14,
    color: "#8b8b8b",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginTop: 10,
  },
  noResultsSubText: {
    fontSize: 14,
    color: "#8b8b8b",
    marginTop: 5,
  },
})

export default SearchScreen

