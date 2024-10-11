import React from 'react'

import Modal from '../Modal'
import { motion, AnimatePresence } from 'framer-motion'
import LeadingIcon from '../LeadingIcon'
import { ReactComponent as XMarkIcon } from '../../assets/svg/x-mark.svg'
import FormField from '../form/FormField'
import Button from '../Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import IOSSwitch from './inputs/IOSSwitch'

const Form = ({ onClose, showForm, title, iconComponent, formFields, primaryButtons, secondaryButtons, onSubmit, item, width, styles }) => {

    const b2gb = (bytes) => {
        return (bytes / (2 ** 10) ** 3).toFixed(2)
    }

    const timeStampToDay = (timeStamp) => {
        const time = timeStamp - Math.floor(Date.now() / 1000)
        return Math.floor(time / 86400) + 1
    }

    const getDefaultValue = (item, field) => {
        if (!item) {
            return ""
        }


        if (field.id === "expire") {
            return timeStampToDay(item[field.id])
        }

        if (field.id === "data_limit") {
            return b2gb(item[field.id])
        }

        if (field.id === "volume") {
            return b2gb(item[field.id])
        }



        return item[field.id]
    }

    const formHeader = (
        <header className="modal__header">
            <LeadingIcon>
                {iconComponent}
            </LeadingIcon>
            <h1 className="modal__title">{title}</h1>
            <div className="close-icon" onClick={onClose}>
                <XMarkIcon />
            </div>
        </header>
    )

    const formFooter = (
        <motion.footer className={`modal__footer ${styles?.footer}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                {secondaryButtons?.map((button, index) => (
                    button.type === "button" ? (
                        <Button
                            key={index}
                            className={button.className}
                            onClick={button.onClick}
                        >
                            {button.icon}
                        </Button>
                    ) : button.type === "switch" ? (
                        <FormControlLabel
                            key={index}
                            onClick={button.onClick}
                            control={<IOSSwitch sx={{ my: 1, mx: 2 }} checked={item ? Boolean(!item.disable) : false} />}
                        //Boolean(!item.disable)
                        />
                    ) : null
                ))}
            </div>
            <div className={styles?.primaryButtons} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {primaryButtons.map((button, index) => (
                    <Button
                        key={index}
                        className={button.className}
                        onClick={button.onClick}
                        disabled={button.disabled}
                    >
                        {button.disabled ? button.pendingText : button.label}
                    </Button>
                ))}
            </div>
        </motion.footer>
    )

    return (
        <AnimatePresence>
            {showForm && (
                <Modal onClose={onClose} width={width}>
                    {formHeader}
                    <main className="modal__body">
                        <form className="modal__form">
                            {formFields.map((group, rowIndex) => (
                                <div key={rowIndex} className="flex gap-16">
                                    {Array.isArray(group) ? group.map((field, index) => {
                                        const defaultValue = getDefaultValue(item, field)

                                        return (<FormField
                                            key={index}
                                            label={field.label}
                                            type={field.type}
                                            id={field.id}
                                            name={field.name}
                                            animateDelay={rowIndex * 0.1}
                                            defaultValue={defaultValue}
                                            disabled={field.disabled}
                                            options={field.options}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder={field.placeholder}
                                            editValue={item ? item.country ? item.country.split(",") : "" : ""}
                                        />)
                                    }) : (
                                        <FormField
                                            key={rowIndex}
                                            label={group.label}
                                            type={group.type}
                                            id={group.id}
                                            name={group.name}
                                            animateDelay={rowIndex * 0.1}
                                            defaultValue={getDefaultValue(item, group)}
                                            disabled={group.disabled}
                                            options={group.options}
                                            value={group.value}
                                            onChange={group.onChange}
                                            placeholder={group.placeholder}
                                            editValue={item ? item.country ? item.country.split(",") : "" : ""}
                                        />
                                    )}
                                </div>
                            ))}
                        </form>
                    </main>
                    {formFooter}
                </Modal>
            )}
        </AnimatePresence>
    )
}

export default Form
