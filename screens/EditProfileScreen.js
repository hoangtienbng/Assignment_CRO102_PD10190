import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const EditProfileScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userData, setUserData] = useState({
    displayName: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (route.params?.user) {
      const { user } = route.params;
      setUserData({
        displayName: user.displayName || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || '',
      });
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [route.params?.user]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const handleSave = async () => {
    if (!userData.displayName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }
  
    setLoading(true);
  
    try {
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (!user) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
  
      // Cập nhật displayName trong Authentication
      await updateProfile(user, {
        displayName: userData.displayName,
      });
  
      // Cập nhật thông tin trong Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: userData.displayName,
        phone: userData.phone,
        address: userData.address,
        avatarUrl: avatarUrl,
        updatedAt: serverTimestamp()
      });
  
      Alert.alert(
        'Thành công', 
        'Thông tin đã được cập nhật',
        [
          {
            text: 'OK',
            onPress: () => {
              // Quay lại màn hình Profile với dữ liệu mới
              navigation.navigate('Profile', {
                updatedUser: {
                  ...userData,
                  avatarUrl: avatarUrl
                }
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa thông tin</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.avatarContainer}>
          <Image 
            source={avatarUrl ? { uri: avatarUrl } : require('../assets/avatar2.png')}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.changeAvatarButton} onPress={pickImage}>
            <Text style={styles.changeAvatarText}>Thay đổi ảnh</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            value={userData.displayName}
            onChangeText={(text) => setUserData({...userData, displayName: text})}
            placeholder="Nhập họ và tên"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={userData.email}
            editable={false}
            placeholder="Email"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={userData.phone}
            onChangeText={(text) => setUserData({...userData, phone: text})}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={[styles.input, styles.addressInput]}
            value={userData.address}
            onChangeText={(text) => setUserData({...userData, address: text})}
            placeholder="Nhập địa chỉ"
            multiline
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addressInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#009245',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  changeAvatarButton: {
    padding: 8,
  },
  changeAvatarText: {
    color: '#009245',
    fontSize: 16,
  },
});

export default EditProfileScreen;