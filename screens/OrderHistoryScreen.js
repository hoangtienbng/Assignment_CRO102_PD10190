import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const OrderHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;

      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', auth.currentUser.uid),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(ordersQuery);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleDateString('vi-VN')
      }));

      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Đơn hàng #{item.id.slice(-5)}</Text>
        <Text style={styles.orderDate}>{item.createdAt}</Text>
      </View>

      <View style={styles.orderContent}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderTotal}>
            Tổng tiền: {item.total.toLocaleString('vi-VN')}đ
          </Text>
          <Text style={styles.orderItemCount}>
            {item.items.length} sản phẩm
          </Text>
        </View>
        
        <View style={styles.thumbnails}>
          {item.items.slice(0, 3).map((product, index) => (
            <Image
              key={index}
              source={{ uri: product.imageUrl }}
              style={styles.thumbnail}
            />
          ))}
          {item.items.length > 3 && (
            <View style={styles.moreItems}>
              <Text style={styles.moreItemsText}>
                +{item.items.length - 3}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#009245" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Sử Đơn Hàng</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="shopping-bag" size={50} color="#ccc" />
          <Text style={styles.emptyText}>
            Bạn chưa có đơn hàng nào
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderDate: {
    color: '#666',
  },
  orderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#009245',
    marginBottom: 4,
  },
  orderItemCount: {
    color: '#666',
  },
  thumbnails: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreItems: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginLeft: -10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default OrderHistoryScreen;