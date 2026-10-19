/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import client from "../../../services/restClient";
import _ from "lodash";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
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

const ClassroomsEditDialogComponent = (props) => {
    const [_entity, set_entity] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const urlParams = useParams();
    

    useEffect(() => {
        set_entity(props.entity);
    }, [props.entity, props.show]);

    

    const onSave = async () => {
        let _data = {
            room: _entity?.room,
building: _entity?.building,
floor: _entity?.floor,
capacity: _entity?.capacity,
hasProjector: _entity?.hasProjector,
        };

        setLoading(true);
        try {
            
        const result = await client.service("classrooms").patch(_entity._id, _data);
        props.onHide();
        props.alert({ type: "success", title: "Edit info", message: "Info classrooms updated successfully" });
        props.onEditResult(result);
        
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

    

    return (
        <Dialog header="Edit Classrooms" visible={props.show} closable={false} onHide={props.onHide} modal style={{ width: "50vw", fontFamily: "Inter, sans-serif", fontSize: "14px", "--cb-font": "Inter, sans-serif", "--cb-size": "14px" }} className="min-w-max scalein animation-ease-in-out animation-duration-1000 cb-appearance" footer={renderFooter()} resizable={false}>
            <div className="grid p-fluid overflow-y-auto"
            style={{ maxWidth: "55vw" }} role="classrooms-edit-dialog-component">
                <div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="room">Room:</label>
                <InputText id="room" className="w-full mb-3 p-inputtext-sm" value={_entity?.room} onChange={(e) => setValByKey("room", e.target.value)}  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["room"]) && (
              <p className="m-0" key="error-room">
                {error["room"]}
              </p>
            )}
          </small>
            </div>
<div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="building">Building:</label>
                <InputText id="building" className="w-full mb-3 p-inputtext-sm" value={_entity?.building} onChange={(e) => setValByKey("building", e.target.value)}  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["building"]) && (
              <p className="m-0" key="error-building">
                {error["building"]}
              </p>
            )}
          </small>
            </div>
<div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="floor">Floor:</label>
                <InputNumber tooltip="Use only numbers" id="floor" className="w-full mb-3 p-inputtext-sm" value={_entity?.floor} onChange={(e) => setValByKey("floor", e.value)}  useGrouping={false}/>
            </span>
            <small className="p-error">
            {!_.isEmpty(error["floor"]) && (
              <p className="m-0" key="error-floor">
                {error["floor"]}
              </p>
            )}
          </small>
            </div>
<div className="col-12 md:col-4 field">
            <span className="align-items-center">
                <label htmlFor="capacity">Capacity:</label>
                <InputNumber tooltip="Use only numbers" id="capacity" className="w-full mb-3 p-inputtext-sm" value={_entity?.capacity} onChange={(e) => setValByKey("capacity", e.value)}  useGrouping={false}/>
            </span>
            <small className="p-error">
            {!_.isEmpty(error["capacity"]) && (
              <p className="m-0" key="error-capacity">
                {error["capacity"]}
              </p>
            )}
          </small>
            </div>
<div className="col-12 md:col-4 field flex">
            <span className="align-items-center">
                <label htmlFor="hasProjector">Has Projector:</label>
                <Checkbox id="hasProjector" className="ml-3" checked={_entity?.hasProjector} onChange={(e) => setValByKey("hasProjector", e.checked)}  />
            </span>
            <small className="p-error">
            {!_.isEmpty(error["hasProjector"]) && (
              <p className="m-0" key="error-hasProjector">
                {error["hasProjector"]}
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

export default connect(mapState, mapDispatch)(ClassroomsEditDialogComponent);
