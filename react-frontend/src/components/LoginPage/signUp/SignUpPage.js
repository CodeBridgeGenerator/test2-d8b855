import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import client from '../../../services/restClient';
import _ from 'lodash';
import SignUpStep from './SignUpStep';
import { Toast } from 'primereact/toast';
import { emailRegex } from '../../../utils/regex';
import { codeGen } from '../../../utils/codegen';
import EnterDetailsStep from './step/EnterDetails';
import VerificationStep from './step/Verification';
import SetUpPassword from './step/SetUpPassword';
import AppFooter from '../../Layouts/AppFooter';

// Signup limit from env, defaults to 5 if not set
const SIGNUP_USER_LIMIT = Number(process.env.REACT_APP_SIGNUP_USER_LIMIT ?? 5);

const SignUpPage = (props) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState();
    const [sysCode, setSysCode] = useState();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [codeError, setCodeError] = useState('');
    const [passwordError, setPasswordError] = useState(null);
    const [step, setStep] = useState(1);
    const [isEmail, setEmailOrStaffId] = useState(true);
    const [isReadyToSendMail, setIsReadyToSendMail] = useState(false);
    const [limitReached, setLimitReached] = useState(false);
    const [checkingLimit, setCheckingLimit] = useState(true);
    const domain = process.env.REACT_APP_EMAIL_DOMAIN;
    const toast = useRef(null);

    const showSuccess = (message) => {
        toast.current.show({
            severity: 'success',
            summary: 'Success',
            detail: message,
            life: 3000
        });
    };
    const showFailure = (summary, message) => {
        toast.current.show({
            severity: 'error',
            summary: summary,
            detail: message,
            life: 3000
        });
    };

    // Returns the total number of registered users
    const _getUserCount = async () => {
        try {
            const res = await client.service('users').find({
                query: {
                    $limit: 0 // only need the total, not the records
                }
            });
            return res?.total ?? 0;
        } catch (err) {
            console.log('Failed to get user count', err);
            return 0;
        }
    };

    // Check the limit when the page loads
    useEffect(() => {
        let mounted = true;
        (async () => {
            setCheckingLimit(true);
            const total = await _getUserCount();
            if (mounted) {
                setLimitReached(total >= SIGNUP_USER_LIMIT);
                setCheckingLimit(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const _getUserEmail = async () => {
        return await client.service('users').find({
            query: {
                email: email
            }
        });
    };
    const _setCounter = async (id, count) => {
        return await client.service('userInvites').patch(id, {
            sendMailCounter: count
        });
    };

    const onFinishStepOne = async () => {
        // Guard: re-check the limit before sending mail
        const total = await _getUserCount();
        if (total >= SIGNUP_USER_LIMIT) {
            setLimitReached(true);
            showFailure('Sign up closed', `The maximum number of users (${SIGNUP_USER_LIMIT}) has been reached. Please contact your admin.`);
            return;
        }

        let finalEmail = email;
        if (!isEmail) {
            // If signing up with Staff ID, append the domain
            finalEmail = `${email}@${domain}`;
        }
        if (!emailRegex.test(finalEmail)) {
            setEmailError('Please enter a valid email');
            return;
        }
        if (!name.length) {
            setNameError('name is required');
            return;
        }
        // Update the email state with the final email
        setEmail(finalEmail);
        setIsReadyToSendMail(true); // Indicate that we're ready to send the mail
    };

    useEffect(() => {
        if (isReadyToSendMail && email) {
            resendMail();
            setIsReadyToSendMail(false); // Reset the flag after sending the mail
        }
    }, [email, isReadyToSendMail]);

    const validateEmail = async () => {
        let loginEmailData = {};
        try {
            loginEmailData = await client.service('userInvites').find({
                query: {
                    emailToInvite: email
                }
            });
        } catch (err) {
            console.log(err);
        }
        // Remove invitation check - always create or get invite record
        if (!loginEmailData || loginEmailData?.data?.length === 0) {
            // No record exists, so create a new one with a generated code.
            const _login = {
                emailToInvite: email,
                access: null,
                code: codeGen(),
                sendMailCounter: 0
            };
            const data = await client.service('userInvites').create(_login);
            loginEmailData.data = [data];
            return loginEmailData.data[0];
        } else {
            // Record exists. Check if the 'code' field is missing or falsy.
            if (!loginEmailData?.data[0]?.code) {
                const patchedRecord = await client.service('userInvites').patch(loginEmailData.data[0]._id, {
                    code: codeGen()
                });
                loginEmailData.data[0] = patchedRecord;
                return loginEmailData.data[0];
            } else return loginEmailData.data[0];
        }
    };
    const validateEmailSending = (loginEmailData) => {
        if (loginEmailData?.sendMailCounter >= 3) {
            showFailure('Mail counter', 'too many tries, please contact your admin');
            return false;
        }
        return true;
    };
    const validateCode = (loginEmailData) => {
        if (loginEmailData?.code > 10000) return true;
        showFailure('Code Generator', 'code not found, please contact your admin');
        return false;
    };
    const resendMail = async () => {
        const loginEmailData = await validateEmail();
        if (_.isEmpty(loginEmailData)) return;
        if (!validateEmailSending(loginEmailData)) return;
        if (!validateCode(loginEmailData)) return;
        setSysCode(loginEmailData.code);
        const _mail = {
            name: 'onCodeVerifyEmail',
            type: 'signup',
            from: 'support@cloudbasha.com',
            recipients: [email],
            status: true,
            data: {
                name: name,
                code: loginEmailData.code,
                projectLabel: process.env.REACT_APP_PROJECT_LABEL ?? process.env.REACT_APP_PROJECT_NAME
            },
            subject: 'email code verification process',
            templateId: 'onCodeVerify'
        };
        setLoading(true);
        client.service('mailQues').create(_mail);
        props.alert({
            title: 'Verification email sent.',
            type: 'success',
            message: 'Proceed to check your email inbox.'
        });
        _setCounter(loginEmailData?._id, Number(++loginEmailData.sendMailCounter));
        setLoading(false);
        setStep(2);
        showSuccess(`Verification email sent to ${email}`);
        return;
    };
    const onFinishStepTwo = () => {
        if (!code || code.length !== 6) {
            setCodeError('Please enter the code');
            return;
        }
        setStep(3);
    };
    const onFinishStepThree = () => {
        if (!password) {
            setPasswordError('Password is required');
            return;
        }
        if (password !== confirmPassword) {
            setConfirmPasswordError('Confirm Password is not correct');
            return;
        }
        signup();
    };
    const validate = () => {
        let isValid = true;
        if (!email) {
            setEmailError('Please Enter a valid email');
            isValid = false;
        }
        if (!name.length) {
            setNameError('name is required');
            isValid = false;
        } else if (name.length < 3) {
            setNameError('Must be at least 3 characters long');
            isValid = false;
        }
        if (!password.length) {
            setPasswordError('Password is required');
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError('Must be at least 6 characters long and have at least one letter, digit, uppercase, lowercase and symbol');
            isValid = false;
        }
        if (password !== confirmPassword) {
            setPasswordError('Confirm Password is not correct');
            isValid = false;
        }
        return isValid;
    };
    const signup = async () => {
        // Final guard: re-check the limit before creating the user
        const total = await _getUserCount();
        if (total >= SIGNUP_USER_LIMIT) {
            setLimitReached(true);
            props.alert({
                title: 'Sign up closed.',
                type: 'error',
                message: `The maximum number of users (${SIGNUP_USER_LIMIT}) has been reached. Please contact your admin.`
            });
            return;
        }

        const user = await _getUserEmail();
        if (validate()) {
            try {
                if (user?.data?.length === 0) {
                    props.createUser({
                        name,
                        email: email,
                        password,
                        status: true
                    });
                    props.alert({
                        title: 'User account created successfully.',
                        type: 'success',
                        message: 'Proceed to login.'
                    });
                    navigate('/login');
                } else {
                    navigate('/login');
                    props.alert({
                        title: 'User account already created.',
                        type: 'warn',
                        message: 'Proceed to login.'
                    });
                }
            } catch (error) {
                props.alert({
                    title: 'User account failed to create.',
                    type: 'error',
                    message: error.message || 'Failed to sign in.'
                });
            }
        } else {
            props.alert({
                title: 'Sign up failed.',
                type: 'error',
                message: 'Please contact admin.'
            });
            return;
        }
    };

    return (
        <div className="flex flex-col min-h-screen align-items-center justify-content-center bg-[#F8F9FA]">
            <Toast ref={toast} position="bottom-center" />
            <div className="fixed top-0 left-0 w-full">
                <div className="flex items-center justify-between p-5 bg-white shadow">
                    <div className="basis-auto">
                        <p className="text-xl font-semibold text-primary"></p>
                    </div>
                    <div className="basis-[700px]">
                        <SignUpStep step={step} />
                    </div>
                    <div className="basis-auto"></div>
                </div>
                <div className="flex items-center gap-2 p-5 bg-transparent">
                    <Link to="/login" className="flex items-center gap-2 font-semibold text-primary">
                        <i className="pi pi-angle-left"></i>
                        <p>Back to login</p>
                    </Link>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 px-3">
                {checkingLimit ? (
                    <div className="flex items-center gap-2 text-primary">
                        <i className="pi pi-spin pi-spinner"></i>
                        <p>Please wait...</p>
                    </div>
                ) : limitReached ? (
                    <div className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded shadow text-center max-w-md">
                        <i className="pi pi-lock text-3xl text-primary"></i>
                        <h2 className="text-xl font-semibold">Sign up closed</h2>
                        <p className="text-gray-600">
                            The maximum number of users ({SIGNUP_USER_LIMIT}) has been reached. Please contact your admin for access.
                        </p>
                        <Link to="/login" className="font-semibold text-primary">
                            Back to login
                        </Link>
                    </div>
                ) : (
                    <>
                        {step === 1 && (
                            <EnterDetailsStep
                                email={email}
                                setEmail={setEmail}
                                emailError={emailError}
                                setEmailError={setEmailError}
                                name={name}
                                setName={setName}
                                nameError={nameError}
                                setNameError={setNameError}
                                onNext={onFinishStepOne}
                                loading={loading}
                                isEmail={isEmail}
                                setEmailOrStaffId={setEmailOrStaffId}
                            />
                        )}
                        {step === 2 && <VerificationStep code={code} sysCode={sysCode} setCode={setCode} codeError={codeError} setCodeError={setCodeError} onNext={onFinishStepTwo} resendCode={resendMail} loading={loading} setLoading={setLoading} />}
                        {step === 3 && (
                            <SetUpPassword
                                password={password}
                                setPassword={setPassword}
                                confirmPassword={confirmPassword}
                                setConfirmPassword={setConfirmPassword}
                                passwordError={passwordError}
                                setPasswordError={setPasswordError}
                                confirmPasswordError={confirmPasswordError}
                                setConfirmPasswordError={setConfirmPasswordError}
                                onNext={onFinishStepThree}
                                loading={loading}
                            />
                        )}
                    </>
                )}
            </div>
            <AppFooter />
        </div>
    );
};
const mapState = (state) => {
    const { isLoggedIn, passwordPolicyErrors } = state.auth;
    return { isLoggedIn, passwordPolicyErrors };
};
const mapDispatch = (dispatch) => ({
    createUser: (data) => dispatch.auth.createUser(data),
    alert: (data) => dispatch.toast.alert(data)
});
export default connect(mapState, mapDispatch)(SignUpPage);