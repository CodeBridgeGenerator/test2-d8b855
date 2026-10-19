import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { connect } from 'react-redux';
import ProtectedRoute from './ProtectedRoute';
import NoMatch from './NoMatch';
import { socket } from '../services/restClient';
import ProjectSideBarLayout from '../components/Layouts/ProjectSideBarLayout';
import LoginPage from '../components/LoginPage/LoginPage';
import SignUpPage from '../components/LoginPage/signUp/SignUpPage';
import ResetPage from '../components/LoginPage/ResetPage';
import MaintenancePage from '../components/common/MaintenancePage';
import LoginFaqPage from '../components/LoginPage/LoginFaqPage';
import DashboardWelcome from '../components/Dashboard/DashboardWelcome';
import Account from '../components/cb_components/Account/Account';
import CBRouter from './CBRouter';
import AppRouter from './AppRouter';
import '../assets/mainTheme/modal.css';

//  ~cb-add-import~

const MyRouter = (props) => {
    const [modal, setModalDisplay] = useState('none');

    useEffect(() => {
        const onConnect = () => {
            console.log('✅ Socket.IO Connected to server');
            setModalDisplay('none');
        };

        const onDisconnect = (reason) => {
            console.log('❌ Socket.IO disconnected:', reason);
            if (reason === 'transport close') {
                setModalDisplay('flex');
                socket.connect();
            }
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, [modal]);

    // <div id="reconnect-modal" className="modal-overlay" style={{ display: `${modal}` }}>
    //             <div className="modal-content">
    //                 <h3>🔄 Connection Lost</h3>
    //                 <p>The service is currently restarting. Please hang tight while we reconnect you...</p>
    //                 <div className="loader"></div>
    //             </div>
    //         </div>

    return (
        <Routes>
            <Route
                path="/"
                exact
                element={
                    props.isLoggedIn ? (
                        <div className="flex min-h-[calc(100vh-5rem)] bg-white mt-20">
                            <ProjectSideBarLayout>
                                <DashboardWelcome />
                            </ProjectSideBarLayout>
                        </div>
                    ) : (
                        <LoginPage />
                    )
                }
            />
            <Route
                path="/login"
                exact
                element={
                    props.isLoggedIn ? (
                        <div className="flex min-h-[calc(100vh-5rem)] bg-white mt-20">
                            <ProjectSideBarLayout>
                                <DashboardWelcome />
                            </ProjectSideBarLayout>
                        </div>
                    ) : (
                        <LoginPage />
                    )
                }
            />
            <Route path="/reset/:singleChangeForgotPasswordId" exact element={<ResetPage />} />
            <Route path="/signup" exact element={<SignUpPage />} />
            <Route path="/maintenance" exact element={<MaintenancePage />} />
            <Route path="/login-faq" exact element={<LoginFaqPage />} />

            <Route element={<ProtectedRoute redirectPath={'/login'} />}>
                <Route path="/project" exact element={<DashboardWelcome />} />
                <Route path="/account" exact element={<Account />} />
                <Route path="/cbAdmin/*" exact element={<CBRouter />} />
                <Route path="/app/*" exact element={<AppRouter />} />
            </Route>

            <Route path="*" element={<NoMatch />} />
        </Routes>
    );
};

const mapState = (state) => {
    const { isLoggedIn } = state.auth;
    return { isLoggedIn };
};
const mapDispatch = (dispatch) => ({
    alert: (data) => dispatch.toast.alert(data),
    hasServicePermission: (service) => dispatch.perms.hasServicePermission(service),
    hasServiceFieldsPermission: (service) => dispatch.perms.hasServiceFieldsPermission(service)
});

export default connect(mapState, mapDispatch)(MyRouter);
