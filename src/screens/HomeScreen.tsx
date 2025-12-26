import React, { useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert, Platform, PermissionsAndroid, FlatList, ListRenderItem, StyleSheet, Dimensions } from 'react-native';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchRandomImage } from '../features/image/imageSlice';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { UnsplashImage } from '../features/image/imageAPI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 8;
const ITEM_WIDTH = (width - (GAP * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

const DownloadIcon = ({ color = "white", size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M17 17H17.01M17.4 14H18C18.9319 14 19.3978 14 19.7654 14.1522C20.2554 14.3552 20.6448 14.7446 20.8478 15.2346C21 15.6022 21 16.0681 21 17C21 17.9319 21 18.3978 20.8478 18.7654C20.6448 19.2554 20.2554 19.6448 19.7654 19.8478C19.3978 20 18.9319 20 18 20H6C5.06812 20 4.60218 20 4.23463 19.8478C3.74458 19.6448 3.35523 19.2554 3.15224 18.7654C3 18.3978 3 17.9319 3 17C3 16.0681 3 15.6022 3.15224 15.2346C3.35523 14.7446 3.74458 14.3552 4.23463 14.1522C4.60218 14 5.06812 14 6 14H6.6M12 15V4M12 15L9 12M12 15L15 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const HomeScreen = () => {
    const dispatch = useAppDispatch();
    const { images, status, error } = useAppSelector((state) => state.image);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (images.length === 0) {
            dispatch(fetchRandomImage(30));
        }
    }, [dispatch, images.length]);

    const handleFetchNewImage = () => {
        dispatch(fetchRandomImage(30));
    };

    const checkPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission Required',
                        message: 'App needs access to your storage to download Photos',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const downloadImage = async (image: UnsplashImage) => {
        if (Platform.OS === 'android' && Platform.Version < 29) {
            const hasPermission = await checkPermission();
            if (!hasPermission) return;
        }

        const { urls, id } = image;
        const fileUrl = urls.regular;

        const { dirs } = ReactNativeBlobUtil.fs;
        const dirToSave = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.PictureDir;
        const filePath = `${dirToSave}/${id}.jpg`;

        ReactNativeBlobUtil.config({
            fileCache: true,
            addAndroidDownloads: {
                useDownloadManager: true,
                notification: true,
                path: filePath,
                description: 'Downloading image.',
                mediaScannable: true,
            },
            path: filePath,
        })
            .fetch('GET', fileUrl)
            .then((res) => {
                console.log('The file saved to ', res.path());
                Alert.alert('Success', 'Image downloaded successfully!');

                if (Platform.OS === 'ios') {
                    ReactNativeBlobUtil.fs.writeFile(res.path(), res.data, 'base64');
                    ReactNativeBlobUtil.ios.previewDocument(res.path());
                }
            })
            .catch((errorMessage) => {
                console.error(errorMessage);
                Alert.alert('Error', 'Failed to download image.');
            });
    };

    const renderItem: ListRenderItem<UnsplashImage> = useCallback(({ item }) => (
        <View style={styles.card}>
            <Image
                source={{ uri: item.urls.small }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.overlay}>
                <Text style={styles.userName} numberOfLines={1}>
                    {item.user.name}
                </Text>
                <TouchableOpacity
                    onPress={() => downloadImage(item)}
                    style={styles.downloadButton}
                >
                    <DownloadIcon color="white" size={20} />
                </TouchableOpacity>
            </View>
        </View>
    ), []);

    if (status === 'loading' && images.length === 0) {
        return (
            <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    if (status === 'failed') {
        return (
            <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={handleFetchNewImage} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.header}>Brihat InfoTech Gallery</Text>
            <FlatList
                data={images}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                onRefresh={handleFetchNewImage}
                refreshing={status === 'loading'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827', // gray-900
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    header: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 16,
    },
    listContent: {
        paddingHorizontal: GAP / 2,
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: GAP,
    },
    card: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH * 1.5,
        backgroundColor: '#1F2937', // gray-800
        borderRadius: 12,
        overflow: 'hidden',
        marginHorizontal: GAP / 2,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userName: {
        color: 'white',
        fontSize: 12,
        textAlign: 'left',
        flex: 1,
        marginRight: 8,
    },
    downloadButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 8,
        borderRadius: 20,
    },
    errorText: {
        color: '#EF4444', // red-500
        fontSize: 16,
    },
    retryButton: {
        backgroundColor: '#2563EB', // blue-600
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 9999,
    },
    retryText: {
        color: 'white',
        fontWeight: '600',
    },
});

export default HomeScreen;
