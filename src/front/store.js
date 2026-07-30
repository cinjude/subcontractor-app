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
     refreshToken: localStorage.getItem("refreshToken" || null),
     customers:[],
     services:[],
     servicesStats:null,
     invoices:[],
     invoiceStats:null
  };
  
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    
    case "login-provider":
      const { provider, token, refreshToken } = action.payload;
      localStorage.setItem("token", token); 
      if(refreshToken) localStorage.setItem("refreshToken", refreshToken)
      return {
        ...store,
        provider,
        token,
        refreshToken: refreshToken || store.refreshToken
      };

    case "refresh-token":
      localStorage.setItem("token", action.payload);
      return{
        ...store,
        token: action.payload
      };      

    case "logout":
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("provider");
      return {
        ...store,
        provider: null,
        token: null,
        refreshToken: null
      };

    case "update_provider":
    return {
        ...store,
        provider: {
            ...store.provider,
            ...action.payload,
        }
    };

    case "set-customers":
      return {
        ...store,
        customers: action.payload,
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

    case "set-invoices":
        return{ ...store, invoices: action.payload};

    case "set-invoice-stats":
         return{ ...store, invoiceStats: action.payload};

    case "add-invoice":
      return{ ...store, invoices: [action.payload, ...store.invoices] };
    
    case "update-invoice":
      return{ ...store, 
          invoices : store.invoices.map(i => i.id === action.payload.id ? action.payload : i)
      };

    case "delete-invoice":
      return{ ...store, invoices: store.invoices.filter( i => i.id !== action.payload ) };
      
    default:
      throw Error("Unknown action.");
  }
}
