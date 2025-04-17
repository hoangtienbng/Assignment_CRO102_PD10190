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

const PendingOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;

      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', auth.currentUser.uid),
        where('status', 'in', ['pending', 'processing']),
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
      console.error('Error fetching pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'processing':
        return 'Đang xử lý';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f7a707';
      case 'processing':
        return '#009245';
      default:
        return '#666';
    }
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Đơn hàng #{item.id.slice(-5)}</Text>
        <Text style={[styles.orderStatus, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>

      {/* Customer Information */}
      <View style={styles.customerInfo}>
        <View style={styles.infoRow}>
          <Feather name="user" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.customer.name}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="phone" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.customer.phone}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.customer.address}
          </Text>
        </View>
      </View>

      <View style={styles.orderContent}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderTotal}>
            Tổng tiền: {item.total.toLocaleString('vi-VN')}đ
          </Text>
          <Text style={styles.orderDate}>Ngày đặt: {item.createdAt}</Text>
          <Text style={styles.paymentMethod}>
            Thanh toán: {item.paymentMethod}
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
        <Text style={styles.headerTitle}>Đơn Hàng Đang Xử Lý</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="package" size={50} color="#ccc" />
          <Text style={styles.emptyText}>
            Không có đơn hàng nào đang xử lý
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
    elevation: 2,
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
  orderStatus: {
    fontWeight: '600',
  },
  customerInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#444',
    flex: 1,
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
  orderDate: {
    color: '#666',
    marginBottom: 4,
  },
  paymentMethod: {
    color: '#666',
    fontStyle: 'italic',
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

export default PendingOrdersScreen;