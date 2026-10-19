import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import client from "../../../services/restClient";
import _ from "lodash";
import initilization from "../../../utils/init";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";


const getSchemaValidationErrorsStrings = (errorObj) => {
    let errMsg = {};
    for (const key in errorObj.errors) {
      if (Object.hasOwnProperty.call(errorObj.errors, key)) {
        const element = errorObj.errors[key];
        if (element?.message) {
          errMsg[key] = element.message;
        }
      }
    }
    return errMsg.length ? errMsg : errorObj.message ? { error : errorObj.message} : {};
};

const EnrollmentsCreateDialogComponent = (props) => {
    const [_entity, set_entity] = useState({});
    const [error, setError] = useState({});
    const [loading, setLoading] = useState(false);
    const urlParams = useParams();
    const [student, setStudent] = useState([])
const [course, setCourse] = useState([])

    useEffect(() => {
        let init  = {status: false};
        if (!_.isEmpty(props?.entity)) {
            init = initilization({ ...props?.entity, ...init }, [student,course], setError);
        }
        set_entity({...init});
        setError({});
    }, [props.show]);

    const validate = () => {
        let ret = true;
        const error = {};
          
            if (_.isEmpty(_entity?.startDate)) {
                error["startDate"] = `Start Date field is required`;
                ret = false;
            }
        if (!ret) setError(error);
        return ret;
    }

    const onSave = async () => {
        if(!validate()) return;
        let _data = {
            student: _entity?.student?._id,course: _entity?.course?._id,startDate: _entity?.startDate,endDate: _entity?.endDate,status: _entity?.status || false,
            createdBy: props.user._id,
            updatedBy: props.user._id
        };

        setLoading(true);

        try {
            
        const result = await client.service("enrollments").create(_data);
        const eagerResult = await client
            .service("enrollments")
            .find({ query: { $limit: 10000 ,  _id :  { $in :[result._id]}, $populate : [
                {
                    path : "student",
                    service : "students",
                    select:["fullName"]},{
                    path : "course",
                    service : "courses",
                    select:["courseName"]}
            ] }});
        props.onHide();
        props.alert({ type: "success", title: "Create info", message: "Info Enrollments updated successfully" });
        props.onCreateResult(eagerResult.data[0]);
        } catch (error) {
            console.debug("error", error);
            setError(getSchemaValidationErrorsStrings(error) || "Failed to create");
            props.alert({ type: "error", title: "Create", message: "Failed to create in Enrollments" });
        }
        setLoading(false);
    };

    

    

    useEffect(() => {
                    // on mount students
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
                    // on mount courses
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
        <Dialog header="Create Enrollments" visible={props.show} closable={false} onHide={props.onHide} modal style={{ width: "50vw", fontFamily: "Inter, sans-serif", fontSize: "14px", "--cb-font": "Inter, sans-serif", "--cb-size": "14px" }} className="min-w-max scalein animation-ease-in-out animation-duration-1000 cb-appearance" footer={renderFooter()} resizable={false}>
            <div className="grid p-fluid overflow-y-auto"
            style={{ maxWidth: "55vw" }} role="enrollments-create-dialog-component">
            <div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="student">Student:</label>
                <Dropdown id="student" value={_entity?.student?._id} optionLabel="name" optionValue="value" options={studentOptions} onChange={(e) => setValByKey("student", {_id : e.value})}  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["student"]) ? (
              <p className="m-0" key="error-student">
                {error["student"]}
              </p>
            ) : null}
          </small>
            </div>
<div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="course">Course:</label>
                <Dropdown id="course" value={_entity?.course?._id} optionLabel="name" optionValue="value" options={courseOptions} onChange={(e) => setValByKey("course", {_id : e.value})}  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["course"]) ? (
              <p className="m-0" key="error-course">
                {error["course"]}
              </p>
            ) : null}
          </small>
            </div>
<div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="startDate">Start Date:</label>
                <Calendar id="startDate"  value={_entity?.startDate ? new Date(_entity?.startDate) : null} dateFormat="dd/mm/yy" onChange={ (e) => setValByKey("startDate", new Date(e.value))} showIcon showButtonBar  required  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["startDate"]) ? (
              <p className="m-0" key="error-startDate">
                {error["startDate"]}
              </p>
            ) : null}
          </small>
            </div>
<div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="endDate">End Date:</label>
                <Calendar id="endDate"  value={_entity?.endDate ? new Date(_entity?.endDate) : null} dateFormat="dd/mm/yy" onChange={ (e) => setValByKey("endDate", new Date(e.value))} showIcon showButtonBar  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["endDate"]) ? (
              <p className="m-0" key="error-endDate">
                {error["endDate"]}
              </p>
            ) : null}
          </small>
            </div>
<div className="col-12 md:col-4 field flex">
            <span className="align-items-center">
                <label htmlFor="status">Status:</label>
                <Checkbox id="status" className="ml-3" checked={_entity?.status} onChange={(e) => setValByKey("status", e.checked)}  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["status"]) ? (
              <p className="m-0" key="error-status">
                {error["status"]}
              </p>
            ) : null}
          </small>
            </div>
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

export default connect(mapState, mapDispatch)(EnrollmentsCreateDialogComponent);
