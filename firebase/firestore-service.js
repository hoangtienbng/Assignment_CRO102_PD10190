import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./config"

// Products
export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding product:", error)
    throw error
  }
}

export const updateProduct = async (productId, productData) => {
  try {
    const productRef = doc(db, "products", productId)
    await updateDoc(productRef, {
      ...productData,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, "products", productId))
    return true
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

export const getProduct = async (productId) => {
  try {
    const docSnap = await getDoc(doc(db, "products", productId))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting product:", error)
    throw error
  }
}

export const getProducts = async (options = {}) => {
  try {
    let q = collection(db, "products")

    // Kiểm tra kỹ lưỡng các tham số trước khi sử dụng trong where()
    if (options.type && typeof options.type === "string" && options.type.trim() !== "") {
      q = query(q, where("type", "==", options.type))
    }

    if (options.categoryId && typeof options.categoryId === "string" && options.categoryId.trim() !== "") {
      q = query(q, where("categoryId", "==", options.categoryId))
    }

    if (options.featured === true || options.featured === false) {
      q = query(q, where("featured", "==", options.featured))
    }

    if (options.orderBy && typeof options.orderBy === "string") {
      const direction = options.orderDirection === "desc" ? "desc" : "asc"
      q = query(q, orderBy(options.orderBy, direction))
    }

    if (options.limit && typeof options.limit === "number" && options.limit > 0) {
      q = query(q, limit(options.limit))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting products:", error)
    // Ghi log chi tiết hơn để dễ dàng gỡ lỗi
    if (error.message) {
      console.error("Error message:", error.message)
    }
    if (options) {
      console.error("Query options:", JSON.stringify(options))
    }
    throw error
  }
}

// Categories
export const addCategory = async (categoryData) => {
  try {
    const docRef = await addDoc(collection(db, "categories"), {
      ...categoryData,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding category:", error)
    throw error
  }
}

export const getCategories = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "categories"))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting categories:", error)
    throw error
  }
}

