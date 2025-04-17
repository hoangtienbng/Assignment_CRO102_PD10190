import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { getDoc, doc, deleteDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        setOrder({
          id: orderDoc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate().toLocaleDateString('vi-VN'),
          completedAt: orderData.completedAt?.toDate().toLocaleDateString('vi-VN')
        });
      } else {
        Alert.alert("Thông báo", "Không tìm thấy đơn hàng");
        navigation.goBack();
      }
    } catch (error) {
      console.error('Lỗi khi tải đơn hàng:', error);
      Alert.alert("Lỗi", "Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const xacNhanDonHang = async () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xác nhận đơn hàng này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              setLoading(true);
              await updateDoc(doc(db, 'orders', orderId), {
                status: 'completed',
                completedAt: serverTimestamp()
              });

              // Thêm thông báo
              await addDoc(collection(db, 'notifications'), {
                userId: order.userId,
                title: 'Đơn hàng đã được xác nhận',
                message: `Đơn hàng #${orderId.slice(-5)} đã được xác nhận thành công`,
                type: 'order_confirmed',
                createdAt: serverTimestamp(),
                read: false
              });
              
              Alert.alert(
                "Thành công",
                "Đơn hàng đã được xác nhận thành công",
                [{ text: "OK", onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Lỗi khi xác nhận:', error);
              Alert.alert("Lỗi", "Không thể xác nhận đơn hàng");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const xoaDonHang = async () => {
    if (order.status !== 'pending') {
      Alert.alert("Thông báo", "Chỉ có thể xóa đơn hàng đang chờ xác nhận");
      return;
    }

    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa đơn hàng này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, 'orders', orderId));

              // Thêm thông báo
              await addDoc(collection(db, 'notifications'), {
                userId: order.userId,
                title: 'Đơn hàng đã bị xóa',
                message: `Đơn hàng #${orderId.slice(-5)} đã bị xóa`,
                type: 'order_deleted',
                createdAt: serverTimestamp(),
                read: false
              });

              Alert.alert(
                "Thành công",
                "Đã xóa đơn hàng",
                [{ text: "OK", onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Lỗi khi xóa:', error);
              Alert.alert("Lỗi", "Không thể xóa đơn hàng");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'completed': return 'Đã hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'completed': return '#009245';
      case 'cancelled': return '#FF0000';
      default: return '#000000';
    }
  };

  const renderOrderItems = () => {
    return order.items.map((item, index) => (
      <View key={index} style={styles.itemContainer}>
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')}đ x {item.quantity}</Text>
        </View>
        <Text style={styles.itemTotal}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</Text>
      </View>
    ));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#009245" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text>Không tìm thấy đơn hàng</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.orderId}>Đơn hàng #{orderId.slice(-5)}</Text>
          <Text style={[styles.status, { color: getStatusColor(order.status) }]}>
            {getStatusText(order.status)}
          </Text>
        </View>

        <View style={styles.section}>
  <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
  <View style={styles.customerInfo}>
    <View style={styles.infoRow}>
      <Feather name="user" size={16} color="#666" />
      <Text style={styles.infoText}>
        Tên: {order.customer?.name || 'Không có thông tin'}
      </Text>
    </View>

    <View style={styles.infoRow}>
      <Feather name="phone" size={16} color="#666" />
      <Text style={styles.infoText}>
        SĐT: {order.customer?.phone || 'Không có thông tin'}
      </Text>
    </View>

    <View style={styles.infoRow}>
      <Feather name="map-pin" size={16} color="#666" />
      <Text style={styles.infoText}>
        Địa chỉ: {order.customer?.address || 'Không có thông tin'}
      </Text>
    </View>
  </View>
</View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm đã đặt</Text>
          {renderOrderItems()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Tổng tiền hàng:</Text>
            <Text style={styles.paymentValue}>{order.subtotal.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Phí vận chuyển:</Text>
            <Text style={styles.paymentValue}>{order.shippingFee.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={[styles.paymentInfo, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalValue}>{order.total.toLocaleString('vi-VN')}đ</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian</Text>
          <Text style={styles.infoText}>Đặt hàng: {order.createdAt}</Text>
          {order.completedAt && (
            <Text style={styles.infoText}>Hoàn thành: {order.completedAt}</Text>
          )}
        </View>

        {order.status === 'pending' && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.confirmButton} onPress={xacNhanDonHang}>
              <Text style={styles.buttonText}>Xác nhận đơn hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={xoaDonHang}>
              <Text style={styles.buttonText}>Xóa đơn hàng</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    marginBottom: 5,
    color: '#333',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '500',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  paymentLabel: {
    fontSize: 15,
    color: '#666',
  },
  paymentValue: {
    fontSize: 15,
    color: '#333',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#009245',
  },
  buttonContainer: {
    padding: 15,
    gap: 10,
  },
  confirmButton: {
    backgroundColor: '#009245',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  customerInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#444',
    flex: 1,
  },
});

export default OrderDetailScreen;
