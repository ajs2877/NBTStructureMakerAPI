var handleLogin = (e) => {
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
    
var handleSignup = (e) => { 
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
    
var LoginWindow = (props) => { 
    return (
    <form id="loginForm" 
            name="loginForm" 
            onSubmit={handleLogin} 
            action="/login" 
            method="POST" 
            className="mainForm">

        <label htmlFor="username">Username: </label> 
        <input id="user" type="text" name="username" placeholder="username"/> 
        <label htmlFor="pass">Password: </label> 
        <input id="pass" type="password" name="pass" placeholder="password"/> 
        <input type="hidden" name="_csrf" value={props.csrf}/> 
        <input className="formSubmit" type="submit" value="Sign in" /> 
    </form> 
    ); 
}; 

var SignupWindow = (props) => { 
    return (
    <form id="signupForm" 
            name="signupForm" 
            onSubmit={handleSignup} 
            action="/signup" 
            method="POST" 
            className="mainForm">

        <label htmlFor="username">Username: </label> 
        <input id="user" type="text" name="username" placeholder="username"/> 
        <label htmlFor="pass">Password: </label> 
        <input id="pass" type="password" name="pass" placeholder="password"/> 
        <label htmlFor="pass2">Password: </label> 
        <input id="pass2" type="password" name="pass2" placeholder="retype password"/> 
        <input type="hidden" name="_csrf" value={props.csrf}/> 
        <input className="formSubmit" type="submit" value="Sign in" /> 
    </form> 
    ); 
}; 

var createLoginWindow = (csrf) => {
    ReactDOM.render(
        <LoginWindow csrf={csrf} />,
        document.querySelector("#content")
    );
};

var createSignupWindow = (csrf) => {
    ReactDOM.render(
        <SignupWindow csrf={csrf} />,
        document.querySelector("#content")
    );
};

var setup = (csrf) => { 
    var loginButton = document.querySelector("#loginButton"); 
    var signupButton = document.querySelector("#signupButton"); 

    signupButton.addEventListener("click", (e) => { 
        e.preventDefault(); 
        createSignupWindow(csrf); 
        return false; 
    }); 

    loginButton.addEventListener("click", (e) => { 
        e.preventDefault(); 
        createLoginWindow(csrf); 
        return false; 
    }); 

    
    createLoginWindow(csrf); //default view 
}; 

var getToken = () => {
    sendAjax('GET', '/getToken', null, (result) => {
        setup(result.csrfToken);
    });
};

$(document).ready(function(){
    getToken();
});