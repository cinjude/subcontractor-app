export const initialStore = () => {
  const getProvider = () => {
    try {
      const providerString = localStorage.getItem("provider");
      if (!providerString || providerString === "undefined") {
        return null;
      }

      return JSON.parse(providerString);
    } catch (error) {
      console.error("Error parsing provider from data", error);
      return null;
    }
  };
  return {
    provider: getProvider(),
     token: localStorage.getItem("token") || null,
     setCustomer:[],
     services:[],
     servicesStats:null
  };
  
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "login-provider":
      const { provider, token } = action.payload;
      localStorage.setItem("token", token); 
      return {
        ...store,
        provider,
        token,
      };
    case "logout":
      localStorage.removeItem("token");
      return {
        ...store,
        provider: null,
        token: null,
      };

    case "set-customer":
      return {
        ...store,
        setCustomer: action.payload,
      };
      
    case "set-services":
      return {
        ...store,
        services: action.payload,
      };
      
    case "set-services-stats":
      return {
        ...store,
        servicesStats: action.payload,
      };
      
    default:
      throw Error("Unknown action.");
  }
}
