export interface User {
    id?: string,
    idToken?: string,
    email: string,
    name?: string,
    password?: string,
    description?,
    image?: string,
    isNewUser?: boolean,
    userPosts?: string[],
    likedPosts?: string[],
}