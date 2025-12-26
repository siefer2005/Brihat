import axios from 'axios';

import { UNSPLASH_ACCESS_KEY } from '@env';

const BASE_URL = 'https://api.unsplash.com';

const unsplashClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
    },
});

console.log('Unsplash Key Loaded:', UNSPLASH_ACCESS_KEY ? 'Yes' : 'No', UNSPLASH_ACCESS_KEY?.substring(0, 5) + '...');


export interface UnsplashImage {
    id: string;
    urls: {
        regular: string;
        small: string;
        full: string;
    };
    alt_description: string;
    user: {
        name: string;
    };
}

export const fetchRandomImageFromApi = async (count: number = 30): Promise<UnsplashImage[]> => {
    try {
        const response = await unsplashClient.get<UnsplashImage[]>('/photos/random', {
            params: { count },
        });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            console.log('API Error Headers:', JSON.stringify(error.response.headers));
            console.log('API Error Data:', JSON.stringify(error.response.data));
        }
        throw error;
    }
};
