let handleLogin = (e) => {
    e.preventDefault(); 

    if($("#user").val() == '' || $("#pass").val() == '') {
        handleError("Username or password is empty"); 
        return false; 
    } 
    
    console.log($("input[name=_csrf]").val()); 

    sendAjax('POST', 
        $("#loginForm").attr("action"),
        $("#loginForm").serialize(), 
        redirect);
         
    return false; 
}; 
    
let handleSignup = (e) => { 
    e.preventDefault(); 

    if($("#user").val() == '' || $("#pass").val() == '' || $("#pass2").val() == ''){
        handleError("All fields are required"); 
        return false; 
    } 

    if($("#pass").val() !== $("#pass2").val()) {
        handleError("Passwords do not match"); 
        return false; 
    } 
    
    sendAjax('POST', 
        $("#signupForm").attr("action"), 
        $("#signupForm").serialize(), 
        redirect); 

    return false; 
}; 
    
let LoginWindow = (props) => { 
    return (
    <form id="loginForm" 
            name="loginForm" 
            onSubmit={handleLogin} 
            action="/login" 
            method="POST" 
            className="mainForm">
        <div>
            <label htmlFor="username">Username: </label> 
            <input id="user" type="text" name="username" placeholder="username"/> 
        </div>
        <div>
            <label htmlFor="pass">Password: </label> 
            <input id="pass" type="password" name="pass" placeholder="password"/> 
        </div>
        <div>
            <input type="hidden" name="_csrf" value={props.csrf}/> 
            <input className="formSubmit" type="submit" value="Sign in" />
        </div>
    </form> 
    ); 
}; 

let SignupWindow = (props) => { 
    return (
    <form id="signupForm" 
            name="signupForm" 
            onSubmit={handleSignup} 
            action="/signup" 
            method="POST" 
            className="mainForm">
        <div>
            <label htmlFor="username">Username: </label> 
            <input id="user" type="text" name="username" placeholder="username"/> 
        </div>
        <div>
            <label htmlFor="pass">Password: </label> 
            <input id="pass" type="password" name="pass" placeholder="password"/> 
        </div>
        <div>
            <label htmlFor="pass2">Password: </label> 
            <input id="pass2" type="password" name="pass2" placeholder="retype password"/> 
        </div>
        <div>
            <input type="hidden" name="_csrf" value={props.csrf}/> 
            <input className="formSubmit" type="submit" value="Sign in" />
        </div>
    </form> 
    ); 
}; 

let createLoginWindow = (csrf) => {
    ReactDOM.render(
        <LoginWindow csrf={csrf} />,
        document.querySelector("#content")
    );
};

let createSignupWindow = (csrf) => {
    ReactDOM.render(
        <SignupWindow csrf={csrf} />,
        document.querySelector("#content")
    );
};

let setup = (csrf) => { 
    let loginButton = document.querySelector("#loginButton"); 
    let signupButton = document.querySelector("#signupButton"); 

    signupButton.addEventListener("click", (e) => { 
        e.preventDefault(); 
        createSignupWindow(csrf); 
        loginButton.style.display = "inline-block";
        signupButton.style.display = "none";
        return false; 
    }); 

    loginButton.addEventListener("click", (e) => { 
        e.preventDefault(); 
        createLoginWindow(csrf); 
        loginButton.style.display = "none";
        signupButton.style.display = "inline-block";
        return false; 
    }); 

    
    createLoginWindow(csrf); //default view 
}; 

let getToken = () => {
    sendAjax('GET', '/getToken', null, (result) => {
        setup(result.csrfToken);
    });
};

$(document).ready(function(){
    getToken();
});