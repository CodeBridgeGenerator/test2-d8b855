import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import client from '../../../services/restClient';
import _ from 'lodash';
import initilization from '../../../utils/init';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect'; // ← changed to MultiSelect

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
    return errMsg;
};

const FcmMessageCreateDialogComponent = (props) => {
    const [_entity, set_entity] = useState({
        title: '',
        body: '',
        recipients: [], // will be array of user _ids
        image: null,
        from: props.user?._id // auto-set to current user
    });
    const [error, setError] = useState({});
    const [loading, setLoading] = useState(false);
    const [usersList, setUsersList] = useState([]); // for recipients dropdown

    useEffect(() => {
        if (props.show) {
            // Reset form when dialog opens
            set_entity({
                title: '',
                body: '',
                recipients: [],
                image: null,
                from: props.user?._id
            });
            setError({});
        }
    }, [props.show, props.user?._id]);

    // Load all users for recipients selection
    useEffect(() => {
        client
            .service('users')
            .find({
                query: {
                    $limit: 10000,
                    $sort: { name: 1 },
                    $select: ['name', '_id']
                }
            })
            .then((res) => {
                const formatted = res.data.map((user) => ({
                    name: user.name || user.email || 'Unnamed',
                    value: user._id
                }));
                setUsersList(formatted);
            })
            .catch((err) => {
                console.error('Failed to load users', err);
                props.alert({
                    title: 'Error',
                    type: 'error',
                    message: 'Could not load users list'
                });
            });
    }, []);

    const validate = () => {
        const errs = {};

        if (!(_entity.title || '').trim()) {
            errs.title = 'Title is required';
        }

        if (!(_entity.body || '').trim()) {
            errs.body = 'Message body is required';
        }

        if (!Array.isArray(_entity.recipients) || _entity.recipients.length === 0) {
            errs.recipients = 'Select at least one recipient';
        }

        if (Object.keys(errs).length > 0) {
            setError(errs);
            return false;
        }
        return true;
    };

    const onSave = async () => {
        if (!validate()) return;

        const dataToSend = {
            title: _entity.title.trim(),
            body: _entity.body.trim(),
            recipients: _entity.recipients, // array of user _ids
            image: null, // always null as requested
            from: props.user?._id, // current user
            createdBy: props.user?._id,
            updatedBy: props.user?._id
        };

        setLoading(true);

        try {
            const created = await client.service('fcmMessages').create(dataToSend);

            // Optional: eager load with populated recipients (for display/confirmation)
            const eager = await client.service('fcmMessages').find({
                query: {
                    _id: created._id,
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
                title: 'Success',
                message: 'Notification message created and queued successfully'
            });

            if (props.onCreateResult) {
                props.onCreateResult(eager.data[0] || created);
            }
        } catch (err) {
            console.error('Create fcmMessage failed:', err);
            const errObj = getSchemaValidationErrorsStrings(err) || {};
            setError(errObj.message ? { general: errObj.message } : errObj);

            props.alert({
                type: 'error',
                title: 'Failed',
                message: 'Could not create notification message'
            });
        } finally {
            setLoading(false);
        }
    };

    const renderFooter = () => (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={props.onHide} disabled={loading} />
            <Button label="Send Notification" icon="pi pi-send" loading={loading} onClick={onSave} />
        </div>
    );

    return (
        <Dialog header="Send Push Notification" visible={props.show} style={{ width: '480px' }} modal closable={false} footer={renderFooter()} onHide={props.onHide}>
            <div className="grid p-fluid">
                <div className="field col-12">
                    <label htmlFor="title">Title *</label>
                    <InputText
                        id="title"
                        value={_entity.title}
                        onChange={(e) => {
                            set_entity({ ..._entity, title: e.target.value });
                            setError((prev) => ({ ...prev, title: null }));
                        }}
                        className={error.title ? 'p-invalid' : ''}
                        placeholder="e.g. Urgent Maintenance Required"
                    />
                    {error.title && <small className="p-error">{error.title}</small>}
                </div>

                <div className="field col-12">
                    <label htmlFor="body">Message *</label>
                    <InputTextarea
                        id="body"
                        rows={5}
                        value={_entity.body}
                        onChange={(e) => {
                            set_entity({ ..._entity, body: e.target.value });
                            setError((prev) => ({ ...prev, body: null }));
                        }}
                        autoResize
                        className={error.body ? 'p-invalid' : ''}
                        placeholder="Write the notification message here..."
                    />
                    {error.body && <small className="p-error">{error.body}</small>}
                </div>

                <div className="field col-12">
                    <label htmlFor="recipients">Recipients *</label>
                    <MultiSelect
                        id="recipients"
                        value={_entity.recipients}
                        options={usersList}
                        onChange={(e) => {
                            set_entity({ ..._entity, recipients: e.value });
                            setError((prev) => ({ ...prev, recipients: null }));
                        }}
                        optionLabel="name"
                        optionValue="value"
                        placeholder="Select one or more users"
                        filter
                        display="chip" // shows selected as nice chips/tags
                        className={error.recipients ? 'p-invalid' : ''}
                        maxSelectedLabels={5}
                        selectedItemsLabel="{0} users selected"
                    />
                    {error.recipients && <small className="p-error">{error.recipients}</small>}
                </div>

                {/* From is now hidden – auto set to current user */}
                <div className="field col-12 mt-2 text-sm text-500">
                    <em>Sending as: {props.user?.name || props.user?.email || 'Current User'}</em>
                </div>

                {error.general && (
                    <div className="col-12 mt-2">
                        <small className="p-error block">{error.general}</small>
                    </div>
                )}
            </div>
        </Dialog>
    );
};

const mapState = (state) => ({
    user: state.auth.user
});

const mapDispatch = (dispatch) => ({
    alert: (data) => dispatch.toast.alert(data)
});

export default connect(mapState, mapDispatch)(FcmMessageCreateDialogComponent);
