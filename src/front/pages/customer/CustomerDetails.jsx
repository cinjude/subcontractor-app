import { useNavigate, useParams } from "react-router-dom";



export default function CustomerDetails() {

    const { id } = useParams()

    const navigate = useNavigate()


    return (
        <div className="container bg-white">
            <div className="">
                <button className="border border-0"
                    onClick={() => navigate(-1)}> <span>←   </span> Back to customer</button>
            </div>
        </div>
    );
}