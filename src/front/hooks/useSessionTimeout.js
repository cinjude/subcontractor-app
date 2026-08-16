import { useCallback, useEffect, useRef } from 'react'
import useGlobalReducer from './useGlobalReducer'
import { refreshAccessToken } from '../pages/auth/services/authService'

const IDLE_WARNING_AT = 25 * 60 * 1000
const IDLE_LOGOUT_AT = 30 * 60 * 1000
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"]

export default function useSessionTimeout ({onWarning, onLogout}){
    const { store, dispatch } = useGlobalReducer()
    const warningTimer = useRef(null)
    const logoutTimer = useRef(null)

    const clearTimers = () => {
        clearTimeout(warningTimer.current)
        clearTimeout(logoutTimer.current)
    }

    const startTimers = useCallback(() => {
        clearTimers()

        warningTimer.current = setTimeout(() => {
            onWarning()
        }, IDLE_WARNING_AT)

        logoutTimer.current = setTimeout(() => {
            onLogout()
        }, IDLE_LOGOUT_AT);

    }, [onWarning, onLogout]);   
    
    const handleActivity = useCallback(() => {
        startTimers();
    }, [startTimers]);

    useEffect(() =>{
        if(!store.token) return;

        startTimers();
        ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, handleActivity));

        return () => {
            clearTimers();
            ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, handleActivity));
        };
    }, [store.token, handleActivity, startTimers]);

    useEffect(() => {
        if(!store.token || !store.refreshToken) return;

        const interval = setInterval(async() => {
            try{
                const newToken = await refreshAccessToken(store.refreshToken);
                dispatch({
                    type: "refresh-token",
                    payload: newToken
                });
            } catch(err){
                console.error("silent token refresh failed.", err)
            }
        }, 25 * 60 * 1000);

        return () => clearInterval(interval)
    }, [store.token, store.refreshToken, dispatch, onLogout]);
}