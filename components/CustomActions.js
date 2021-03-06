import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Expo Permissions API, ImagePicker API, Location API
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import firebase from 'firebase';

export default class CustomActions extends Component {
  /**
   * access device's photo library
   * @async
   * @function pickImage
   * @returns {Promise<string>} Image uri
  */
  pickImage = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
      }).catch((error) => console.log(error));
      if (!result.cancelled) {
        const imageUrl = await this.uploadImage(result.uri);
        this.props.onSend({ image: imageUrl });
      }
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * access device's camera to take photo
   * @async
   * @function takePhoto
   * @returns {Promise<string>} Image uri
  */
  takePhoto = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL, Permissions.CAMERA);
    try {
      if (status === 'granted') {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'Images',
        }).catch((error) => console.log(error));
        if (!result.cancelled) {
          const imageUrl = await this.uploadImage(result.uri);
          this.props.onSend({ image: imageUrl });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * upload image to Firebase cloud storage (via XMLHttpRequest)
   * @async
   * @function uploadImage
   * @param {string} uri - image uri
   * @returns {Promise<string>} Image URL
  */
  uploadImage = async (uri) => {
    try {
      // 'blob'- binary large object
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          resolve(xhr.response);
        };
        xhr.onerror = (err) => {
          console.log(err);
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });
      // creates unique file name for each uploaded image
      const getImageName = uri.split('/');
      const imageName = getImageName[getImageName.length - 1];
      // reference to storage
      const ref = firebase.storage().ref().child(`${imageName}`);
      const snapshot = await ref.put(blob);

      blob.close();
      const imageUrl = await snapshot.ref.getDownloadURL();
      return imageUrl;
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * access device's location  data
   * @async
   * @function getLocation
   * @returns {Promise<string>} The current geo location
  */
  getLocation = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    try {
      if (status === 'granted') {
        const result = await Location.getCurrentPositionAsync({})
          .catch((error) => console.log(error));
        if (result) {
          this.props.onSend({
            location: {
              longitude: result.coords.longitude,
              latitude: result.coords.latitude,
            },
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * define array of strings to be displayed in the actionSheet
   * @function onActionPress
   * @returns {actionSheet} Option to choose from library, take photo, or get location
  */
  onActionPress = () => {
    const options = ['Choose From Library', 'Take Picture', 'Send Location', 'Cancel'];
    const cancelButtonIndex = options.length - 1;
    // hand down display options to ActionSheet component
    this.context.actionSheet().showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            console.log('user wants to pick an image');
            return this.pickImage();
          case 1:
            console.log('user wants to take a photo');
            return this.takePhoto();
          case 2:
            console.log('user wants to get his location');
            return this.getLocation();
          default:
        }
      },
    );
  };

  render() {
    return (
      <TouchableOpacity
        accessible
        accessibilityRole="button"
        accessibilityLabel="Tap me!"
        accessibilityHint="Send image or location"
        style={[styles.container]}
        onPress={this.onActionPress}
      >
        <View style={[styles.wrapper, this.props.wrapperStyle]}>
          <Text style={[styles.iconText, this.props.iconTextStyle]}>+</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: 26,
    height: 26,
    marginLeft: 10,
    marginBottom: 10,
  },
  wrapper: {
    borderRadius: 13,
    borderColor: '#b2b2b2',
    borderWidth: 2,
    flex: 1,
  },
  iconText: {
    color: '#b2b2b2',
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
});

CustomActions.contextTypes = {
  actionSheet: PropTypes.func,
};
