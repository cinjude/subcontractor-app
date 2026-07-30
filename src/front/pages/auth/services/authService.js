export async function refreshAccessToken(refreshToken){

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/token/refresh`,{
        method: "POST",
        headers:{
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
        },
    });
    if(!response.ok)
        throw new Error("Refresh failed")

    const data = await response.json()
    return data.token
}