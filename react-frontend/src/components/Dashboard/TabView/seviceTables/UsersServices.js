import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { connect } from 'react-redux';
import UsersPage from '../../../cb_components/UsersPage/UsersPage';
import UserInvitationPage from '../../../cb_components/UserInvitesPage/UserInvitesPage';
import UserAddressesPage from '../../../cb_components/UserAddressesPage/UserAddressesPage';

import UserPhonesPage from '../../../cb_components/UserPhonesPage/UserPhonesPage';
import UserChangePasswordPage from '../../../cb_components/UserChangePasswordPage/UserChangePasswordPage';
import UserLoginPage from '../../../cb_components/UserLogin/UserLoginPage';

const UserServices = (props) => {
    return (
        <TabView>
            <TabPanel header="Users">
                <UsersPage></UsersPage>
            </TabPanel>

            <TabPanel header="User Invitations">
                <UserInvitationPage></UserInvitationPage>
            </TabPanel>

            <TabPanel header="Addresses">
                <UserAddressesPage></UserAddressesPage>
            </TabPanel>

            <TabPanel header="Phones">
                <UserPhonesPage></UserPhonesPage>
            </TabPanel>

            <TabPanel header="Change Password">
                <UserChangePasswordPage></UserChangePasswordPage>
            </TabPanel>

            <TabPanel header="Login History">
                <UserLoginPage></UserLoginPage>
            </TabPanel>
        </TabView>
    );
};

const mapState = (state) => {
    const { user } = state.auth;
    return { user };
};
const mapDispatch = (dispatch) => ({
    alert: (data) => dispatch.toast.alert(data),
    hasServicePermission: (service) => dispatch.perms.hasServicePermission(service),
    hasServiceFieldsPermission: (service) => dispatch.perms.hasServiceFieldsPermission(service)
});

export default connect(mapState, mapDispatch)(UserServices);
