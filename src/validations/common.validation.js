function isEmpty(value){
    return value === "";
}

function isEmailCorrect(email){
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexEmail.test(email);
}

export {isEmpty,isEmailCorrect} 