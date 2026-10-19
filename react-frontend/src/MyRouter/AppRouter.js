import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { connect } from 'react-redux';
import ProtectedRoute from './ProtectedRoute';

import SingleStudentsPage from "../components/app_components/StudentsPage/SingleStudentsPage";
import StudentProjectLayoutPage from "../components/app_components/StudentsPage/StudentProjectLayoutPage";
import SingleCoursesPage from "../components/app_components/CoursesPage/SingleCoursesPage";
import CourseProjectLayoutPage from "../components/app_components/CoursesPage/CourseProjectLayoutPage";
import SingleEnrollmentsPage from "../components/app_components/EnrollmentsPage/SingleEnrollmentsPage";
import EnrollmentProjectLayoutPage from "../components/app_components/EnrollmentsPage/EnrollmentProjectLayoutPage";
import SingleClassroomsPage from "../components/app_components/ClassroomsPage/SingleClassroomsPage";
import ClassroomProjectLayoutPage from "../components/app_components/ClassroomsPage/ClassroomProjectLayoutPage";
//  ~cb-add-import~

const AppRouter = () => {
    return (
        <Routes>
            {/* ~cb-add-unprotected-route~ */}
<Route path="/students/:singleStudentsId" exact element={<SingleStudentsPage />} />
<Route path="/students" exact element={<StudentProjectLayoutPage />} />
<Route path="/courses/:singleCoursesId" exact element={<SingleCoursesPage />} />
<Route path="/courses" exact element={<CourseProjectLayoutPage />} />
<Route path="/enrollments/:singleEnrollmentsId" exact element={<SingleEnrollmentsPage />} />
<Route path="/enrollments" exact element={<EnrollmentProjectLayoutPage />} />
<Route path="/classrooms/:singleClassroomsId" exact element={<SingleClassroomsPage />} />
<Route path="/classrooms" exact element={<ClassroomProjectLayoutPage />} />
            <Route element={<ProtectedRoute redirectPath={'/login'} />}>{/* ~cb-add-protected-route~ */}</Route>
        </Routes>
    );
};

const mapState = (state) => {
    const { isLoggedIn } = state.auth;
    return { isLoggedIn };
};
const mapDispatch = (dispatch) => ({
    alert: (data) => dispatch.toast.alert(data)
});

export default connect(mapState, mapDispatch)(AppRouter);
