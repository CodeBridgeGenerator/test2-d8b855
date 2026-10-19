/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import client from '../../../services/restClient';
import _ from 'lodash';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';

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

const FcmMessageEditDialogComponent = (props) => {
    const [_entity, set_entity] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const urlParams = useParams();
    const [recipients, setRecipients] = useState([]);
    const [from, setFrom] = useState([]);

    useEffect(() => {
        set_entity(props.entity);
    }, [props.entity, props.show]);

    useEffect(() => {
        //on mount users
        client
            .service('users')
            .find({
                query: {
                    $limit: 10000,
                    $sort: { name: -1 },
                    _id: urlParams.singleUsersId
                }
            })
            .then((res) => {
                setRecipients(
                    res.data.map((e) => {
                        return { name: e['name'], value: e._id };
                    })
                );
            })
            .catch((error) => {
                console.debug({ error });
                props.alert({
                    title: 'Users',
                    type: 'error',
                    message: error.message || 'Failed get users'
                });
            });
    }, []);

    const onSave = async () => {
        let _data = {
            title: _entity?.title,
            body: _entity?.body,
            recipients: _entity?.recipients?._id,
            image: _entity?.image,
            from: _entity?.from?._id
        };

        setLoading(true);
        try {
            await client.service('fcmMessages').patch(_entity._id, _data);
            const eagerResult = await client.service('fcmMessages').find({
                query: {
                    $limit: 10000,
                    _id: { $in: [_entity._id] },
                    $populate: [
                        {
                            path: 'recipients',
                            service: 'users',
                            select: ['name']
                        }
                    ]
                }
            });
            props.onHide();
            props.alert({
                type: 'success',
                title: 'Edit info',
                message: 'Info fcmMessage updated successfully'
            });
            props.onEditResult(eagerResult.data[0]);
        } catch (error) {
            console.debug('error', error);
            setError(getSchemaValidationErrorsStrings(error) || 'Failed to update info');
            props.alert({
                type: 'error',
                title: 'Edit info',
                message: 'Failed to update info'
            });
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

    const recipientsOptions = recipients.map((elem) => ({
        name: elem.name,
        value: elem.value
    }));
    const fromOptions = from.map((elem) => ({
        name: elem.name,
        value: elem.value
    }));

    return (
        <Dialog header="Edit Fcm Message" visible={props.show} closable={false} onHide={props.onHide} modal style={{ width: '40vw' }} className="min-w-max scalein animation-ease-in-out animation-duration-1000" footer={renderFooter()} resizable={false}>
            <div className="grid p-fluid overflow-y-auto" style={{ maxWidth: '55vw' }} role="fcmMessage-edit-dialog-component">
                <div className="col-12 md:col-6 field">
                    <span className="align-items-center">
                        <label htmlFor="title">Title:</label>
                        <InputText id="title" className="w-full mb-3 p-inputtext-sm" value={_entity?.title} onChange={(e) => setValByKey('title', e.target.value)} required />
                    </span>
                    <small className="p-error">
                        {!_.isEmpty(error['title']) && (
                            <p className="m-0" key="error-title">
                                {error['title']}
                            </p>
                        )}
                    </small>
                </div>
                <div className="col-12 md:col-6 field">
                    <span className="align-items-center">
                        <label htmlFor="body">Body:</label>
                        <InputTextarea id="body" rows={5} cols={30} value={_entity?.body} onChange={(e) => setValByKey('body', e.target.value)} autoResize required />
                    </span>
                    <small className="p-error">
                        {!_.isEmpty(error['body']) && (
                            <p className="m-0" key="error-body">
                                {error['body']}
                            </p>
                        )}
                    </small>
                </div>
                <div className="col-12 md:col-6 field">
                    <span className="align-items-center">
                        <label htmlFor="recipients">Recipients:</label>
                        <Dropdown id="recipients" value={_entity?.recipients?._id} optionLabel="name" optionValue="value" options={recipientsOptions} onChange={(e) => setValByKey('recipients', { _id: e.value })} required />
                    </span>
                    <small className="p-error">
                        {!_.isEmpty(error['recipients']) && (
                            <p className="m-0" key="error-recipients">
                                {error['recipients']}
                            </p>
                        )}
                    </small>
                </div>
                <div className="col-12 md:col-6 field">
                    <span className="align-items-center">
                        <label htmlFor="image">Image:</label>
                        <InputText className="w-full mb-3 p-inputtext-sm" value={_entity?.image} onChange={(e) => setValByKey('image', e.target.value)} />
                    </span>
                    <small className="p-error">
                        {!_.isEmpty(error['image']) && (
                            <p className="m-0" key="error-image">
                                {error['image']}
                            </p>
                        )}
                    </small>
                </div>
                <div className="col-12 md:col-6 field">
                    <span className="align-items-center">
                        <label htmlFor="from">From:</label>
                        <Dropdown id="from" value={_entity?.from?._id} optionLabel="name" optionValue="value" options={fromOptions} onChange={(e) => setValByKey('from', { _id: e.value })} />
                    </span>
                    <small className="p-error">
                        {!_.isEmpty(error['from']) && (
                            <p className="m-0" key="error-from">
                                {error['from']}
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
    alert: (data) => dispatch.toast.alert(data)
});

export default connect(mapState, mapDispatch)(FcmMessageEditDialogComponent);
