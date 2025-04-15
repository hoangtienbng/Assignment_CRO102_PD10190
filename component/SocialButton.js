import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';

const SocialButton = ({ icon, onPress }) => {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Image source={icon} style={styles.icon} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    icon: {
        width: 40,
        height: 40,
    }
});

export default SocialButton;