import { Outlet, useLocation } from "react-router-dom"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"

export const Layout = () => {
    const location = useLocation();
    const isPortfolioPage = location.pathname.startsWith('/portfolio/');

    return (
        <ScrollToTop>
            {!isPortfolioPage && <Navbar />}
            <Outlet />
            {!isPortfolioPage && <Footer />}
        </ScrollToTop>
    )
}