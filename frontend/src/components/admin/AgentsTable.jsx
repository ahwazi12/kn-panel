import React from "react"

import "./AgentsTable.css"
import EmptyTable from "../EmptyTable"
import gbOrTb from "../../utils/gbOrTb"
import businessModeIcon from "../../assets/bm.png"

const b2gb = (bytes) => {
    return (bytes / (2 ** 10) ** 3).toFixed(2);
}

const showCountries = (str) => {
    if(!str) return <span className="country_span_off" >NO ACCESS</span>;
    var country_arr = str.split(",");
    return country_arr.map((country) => (
        <span className="country_span" key={country}>{country}</span>
    ));
}

const AdminPanelsTable = ({ items, itemsPerPage, currentItems, onEditItem, onCreateItem }) => {
    return (
        <div className="wrapper" style={{ Width: "1230px", overflowX: "auto" }}>
            <table className="agents-table">
                <thead className="agents-table__header">
                    <tr className="agents-table__header__row">
                        <th>Name</th>
                        <th>Status</th>
                        <th>Active Users</th>
                        <th>Data Usage</th>
                        <th>Remaining Data</th>
                        <th>Allocatable Data</th>
                        <th>Prefix</th>
                        <th>Country</th>
                    </tr>
                </thead>
                <tbody className="agents-table__body">
                    {items.length === 0
                        ? <EmptyTable tableType={"agent"} colSpan={8} onCreateButton={onCreateItem} />
                        : currentItems.map((item) => (
                            <tr onClick={() => onEditItem(item)} key={item.id} agent_id={item.id} >
                                <td className="agent_name_row" > <div> <img src={businessModeIcon} className={item.business_mode?"bm_icon":"bm_icon bm_off"} /> <span> {item.name} </span>  </div> </td>
                                <td>
                                    <span className={`status ${item.disable ? "limited2" : "active"}`} >
                                        {item.disable ? "Disabled" : "Active"}
                                    </span>
                                </td>
                                <td >{item.active_users + " / " + item.total_users}</td>
                                <td>{gbOrTb(item.used_traffic) + " / " + gbOrTb(b2gb(item.lifetime_volume))}</td>
                                <td>{gbOrTb(b2gb(item.volume))}</td>
                                <td>{gbOrTb(item.allocatable_data)}</td>
                                <td>{item.prefix}</td>
                                <td className="country_td" >
                                    <div> {showCountries(item.country)} </div>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    )
}

export default AdminPanelsTable