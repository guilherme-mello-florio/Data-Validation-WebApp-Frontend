import AccountInfo from "../AccountInfo";
import logo from '../wysupp-logo.svg';

export default function AdminHeader({page}){
    const username = localStorage.getItem('username');

    return(
        <div className="admin_header">  
            <section className="admin_header_section">
                <img style={{ maxWidth: "300px", maxHeight: "60px", marginTop: "4vh"}} src={logo} />
                <h1> {page} </h1>
                <AccountInfo username={username} />
            </section>
            <section className="admin_header_section">
                {/* BACK BUTTON MELHOR */}
                <div className="back_button_pages" onClick={() => window.history.back()}>◄ Back</div>
                <div><b>Project selected:</b> TEMPLATE</div>
            </section>
        </div>
    )
}