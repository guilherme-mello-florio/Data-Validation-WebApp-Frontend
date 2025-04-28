import React, { useRef, useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from './wysupp-logo.svg';
import lockicon from './lock icon.png';
import circle from './circle.png';
import checkcircle from './circle check.png';

function ProtectedPageChangePassword() {
    const usrname = localStorage.getItem('username')
    const [username, setUsername] = useState(usrname);
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [captchaDone, setCaptchaDone] = useState(false);

    const [lowerValidated, setLowerValidated]=useState(false);
    const [upperValidated, setUpperValidated]=useState(false);
    const [numberValidated, setNumberValidated]=useState(false);
    const [specialValidated, setSpecialValidated]=useState(false);
    const [lengthValidated, setLengthValidated]=useState(false);

    const navigate = useNavigate();


    // Validate form fields
    const validateForm = () => {

        if (!username || !password) {
            setError('Username and password are required');
            return false;
        }
        setError('');
        return true;
    };

    // Handle Submit
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        if (newPassword != confirmNewPassword) {
            setError('New passwords don\'t match');
            return;
        }

        const formDetails = new URLSearchParams();
        formDetails.append('username', username);
        formDetails.append('password', password);

        const newPasswordDetails = {
            new_password: newPassword,
        };

        try {

            const response = await fetch('http://localhost:8000/token/change-password', {   
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formDetails,
            });

            const user_response = await fetch('http://localhost:8000/users/' + username + '/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newPasswordDetails),
            });


            if (response.ok && user_response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access_token);

                alert("Password changed succesfully!");
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Authentication failed!');

                setLoginAttempts(loginAttempts + 1);
                localStorage.setItem('login_attempts', JSON.stringify(loginAttempts));
                console.log(loginAttempts);
            } 
        } catch (error) {
            setLoading(false);
            console.log(error);
            setError('An error has ocurred. Please try again later.');
        }
    };

    // Validate password strength
    const handleChange=(value)=>{
        setNewPassword(value);

        const lower = new RegExp('(?=.*[a-z])');
        const upper = new RegExp('(?=.*[A-Z])');
        const number = new RegExp('(?=.*[0-9])');
        const special = new RegExp('(?=.*[!@#\$%\^&\*])');
        const length = new RegExp('(?=.{8,})')
        if(lower.test(value)){
          setLowerValidated(true);
        }
        else{
          setLowerValidated(false);
        }
        if(upper.test(value)){
          setUpperValidated(true);
        }
        else{
          setUpperValidated(false);
        }
        if(number.test(value)){
          setNumberValidated(true);
        }
        else{
          setNumberValidated(false);
        }
        if(special.test(value)){
          setSpecialValidated(true);
        }
        else{
          setSpecialValidated(false);
        }
        if(length.test(value)){
          setLengthValidated(true);
        }
        else{
          setLengthValidated(false);
        }
      }

      function back (){
        navigate('/home');
      }

    return(
        <div className='body'>
        <div className='login_deco'>
            <div className='back_button' onClick={back}>◄ Back</div>
                <img src={logo} alt="logo" />
        </div>
        <div className='login_body'>
            <div>
                <center>
                    <h1 style={{fontSize: "40px"}}>Password change</h1>
                </center>
            </div>


            <main className='tracker-box'>
                <div className={lowerValidated?'validated':'not-validated'}>
                    {lowerValidated?(
                    <span className='list-icon green'>
                        <img src={checkcircle} className='input_icon' />
                    </span>
                    ):(
                    <span className='list-icon'>
                        <img src={circle} className='input_icon' /> 
                    </span>
                    )}
                    At least one lowercase letter
                </div>
                <div className={upperValidated?'validated':'not-validated'}>
                    {upperValidated?(
                    <span className='list-icon green'>
                        <img src={checkcircle} className='input_icon' />
                    </span>
                    ):(
                    <span className='list-icon'>
                        <img src={circle} className='input_icon' /> 
                    </span>
                    )}
                    At least one uppercase letter
                </div>
                <div className={numberValidated?'validated':'not-validated'}>
                    {numberValidated?(
                    <span className='list-icon green'>
                        <img src={checkcircle} className='input_icon' />
                    </span>
                    ):(
                    <span className='list-icon'>
                        <img src={circle} className='input_icon' />  
                    </span>
                    )}
                    At least one number
                </div>
                <div className={specialValidated?'validated':'not-validated'}>
                    {specialValidated?(
                    <span className='list-icon green'>
                        <img src={checkcircle} className='input_icon' />
                    </span>
                    ):(
                    <span className='list-icon'>
                        <img src={circle} className='input_icon' />  
                    </span>
                    )}
                    At least one special character
                </div>
                <div className={lengthValidated?'validated':'not-validated'}>
                    {lengthValidated?(
                    <span className='list-icon green'>
                        <img src={checkcircle} className='input_icon' /> 
                    </span>
                    ):(
                    <span className='list-icon'>
                        <img src={circle} className='input_icon' /> 
                    </span>
                    )}
                    At least 8 characters
                </div>
            </main>


            <section className='login_section'>
                {error && <p className='errmsg_password_change'>{error}</p>}
                <form className='login_form' onSubmit={handleSubmit}>
                    <label>Old Password:</label>
                    <section  className='login_input'>
                        <img src={lockicon} className='input_icon' />
                        <input
                            type="password"
                            id="password"
                            placeholder='Password'
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            required
                        />
                    </section>
                    <label>New password:</label>
                    <section  className='login_input'>
                        <img src={lockicon} className='input_icon' />
                        <input
                            type="password"
                            id="newpassword"
                            placeholder='New password'
                            onChange={(e)=>handleChange(e.target.value)}
                            value={newPassword}
                            required
                        />
                    </section>
                    <label>Confirm new password:</label>
                    <section  className='login_input'>
                        <img src={lockicon} className='input_icon' />
                        <input
                            type="password"
                            id="confirmnewpassword"
                            placeholder='New password'
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            value={confirmNewPassword}
                            required
                        />
                    </section>
                    {lowerValidated && upperValidated && numberValidated && specialValidated && lengthValidated &&  <button className='change_password_button'>Change Password</button>}
                </form>
            </section>
        </div>
    </div>
    );
}

export default ProtectedPageChangePassword;