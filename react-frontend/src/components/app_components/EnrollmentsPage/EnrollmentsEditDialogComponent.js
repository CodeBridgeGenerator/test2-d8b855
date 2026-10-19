/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import client from "../../../services/restClient";
import _ from "lodash";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from "primereact/calendar";
import { Checkbox } from 'primereact/checkbox';


const getSchemaValidationErrorsStrings = (errorObj) => {
    let errMsg = {};
    for (const key in errorObj.errors) {
        if (Object.hasOwnProperty.call(errorObj.errors, key)) {
            const element = errorObj.errors[key];
            if (element?.message) {
                errMsg.push(element.message);
            }
        }
    }
    return errMsg.length ? errMsg : errorObj.message ? errorObj.message : null;
};

const EnrollmentsEditDialogComponent = (props) => {
    const [_entity, set_entity] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const urlParams = useParams();
    const [student, setStudent] = useState([])
const [course, setCourse] = useState([])

    useEffect(() => {
        set_entity(props.entity);
    }, [props.entity, props.show]);

     useEffect(() => {
                    //on mount students
                    client
                        .service("students")
                        .find({ query: { $limit: 10000, $sort: { createdAt: -1 }, _id : urlParams.singleStudentsId } })
                        .then((res) => {
                            setStudent(res.data.map((e) => { return { name: e['fullName'], value: e._id }}));
                        })
                        .catch((error) => {
                            console.debug({ error });
                            props.alert({ title: "Students", type: "error", message: error.message || "Failed get students" });
                        });
                }, []);
 useEffect(() => {
                    //on mount courses
                    client
                        .service("courses")
                        .find({ query: { $limit: 10000, $sort: { createdAt: -1 }, _id : urlParams.singleCoursesId } })
                        .then((res) => {
                            setCourse(res.data.map((e) => { return { name: e['courseName'], value: e._id }}));
                        })
                        .catch((error) => {
                            console.debug({ error });
                            props.alert({ title: "Courses", type: "error", message: error.message || "Failed get courses" });
                        });
                }, []);

    const onSave = async () => {
        let _data = {
            student: _entity?.student?._id,
course: _entity?.course?._id,
startDate: _entity?.startDate,
endDate: _entity?.endDate,
status: _entity?.status,
        };

        setLoading(true);
        try {
            
        await client.service("enrollments").patch(_entity._id, _data);
        const eagerResult = await client
            .service("enrollments")
            .find({ query: { $limit: 10000 ,  _id :  { $in :[_entity._id]}, $populate : [
                {
                    path : "student",
                    service : "students",
                    select:["fullName"]},{
                    path : "course",
                    service : "courses",
                    select:["courseName"]}
            ] }});
        props.onHide();
        props.alert({ type: "success", title: "Edit info", message: "Info enrollments updated successfully" });
        props.onEditResult(eagerResult.data[0]);
        } catch (error) {
            console.debug("error", error);
            setError(getSchemaValidationErrorsStrings(error) || "Failed to update info");
            props.alert({ type: "error", title: "Edit info", message: "Failed to update info" });
        }
        setLoading(false);
    };

    const renderFooter = () => (
        <div className="flex justify-content-end">
            <Button label="save" className="p-button-text no-focus-effect" onClick={onSave} loading={loading} />
            <Button label="close" className="p-button-text no-focus-effect p-button-secondary" onClick={props.onHide} />
        </div>
    );

    const setValByKey = (key, val) => {
        let new_entity = { ..._entity, [key]: val };
        set_entity(new_entity);
        setError({});
    };

    const studentOptions = student.map((elem) => ({ name: elem.name, value: elem.value }));
const courseOptions = course.map((elem) => ({ name: elem.name, value: elem.value }));

    return (
        <Dialog header="Edit Enrollments" visible={props.show} closable={false} onHide={props.onHide} modal style={{ width: "50vw", fontFamily: "Inter, sans-serif", fontSize: "14px", "--cb-font": "Inter, sans-serif", "--cb-size": "14px" }} className="min-w-max scalein animation-ease-in-out animation-duration-1000 cb-appearance" footer={renderFooter()} resizable={false}>
            <div className="grid p-fluid overflow-y-auto"
            style={{ maxWidth: "55vw" }} role="enrollments-edit-dialog-component">
                <div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="student">Student:</label>
                <Dropdown id="student" value={_entity?.student?._id} optionLabel="name" optionValue="value" options={studentOptions} onChange={(e) => setValByKey("student", {_id : e.value})}  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["student"]) && (
              <p className="m-0" key="error-student">
                {error["student"]}
              </p>
            )}
          </small>
            </div>
<div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="course">Course:</label>
                <Dropdown id="course" value={_entity?.course?._id} optionLabel="name" optionValue="value" options={courseOptions} onChange={(e) => setValByKey("course", {_id : e.value})}  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["course"]) && (
              <p className="m-0" key="error-course">
                {error["course"]}
              </p>
            )}
          </small>
            </div>
<div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="startDate">Start Date:</label>
                <Calendar id="startDate"  value={_entity?.startDate ? new Date(_entity?.startDate) : null} dateFormat="dd/mm/yy" onChange={ (e) => setValByKey("startDate", new Date(e.value))} showIcon showButtonBar  required  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["startDate"]) && (
              <p className="m-0" key="error-startDate">
                {error["startDate"]}
              </p>
            )}
          </small>
            </div>
<div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="endDate">End Date:</label>
                <Calendar id="endDate"  value={_entity?.endDate ? new Date(_entity?.endDate) : null} dateFormat="dd/mm/yy" onChange={ (e) => setValByKey("endDate", new Date(e.value))} showIcon showButtonBar  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["endDate"]) && (
              <p className="m-0" key="error-endDate">
                {error["endDate"]}
              </p>
            )}
          </small>
            </div>
<div className="col-12 md:col-4 field flex">
            <span className="align-items-center">
                <label htmlFor="status">Status:</label>
                <Checkbox id="status" className="ml-3" checked={_entity?.status} onChange={(e) => setValByKey("status", e.checked)}  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["status"]) && (
              <p className="m-0" key="error-status">
                {error["status"]}
              </p>
            )}
          </small>
            </div>
                <div className="col-12">&nbsp;</div>
                <small className="p-error">
                {Array.isArray(Object.keys(error))
                ? Object.keys(error).map((e, i) => (
                    <p className="m-0" key={i}>
                        {e}: {error[e]}
                    </p>
                    ))
                : error}
            </small>
            </div>
        </Dialog>
    );
};

const mapState = (state) => {
    const { user } = state.auth;
    return { user };
};
const mapDispatch = (dispatch) => ({
    alert: (data) => dispatch.toast.alert(data),
});

export default connect(mapState, mapDispatch)(EnrollmentsEditDialogComponent);
