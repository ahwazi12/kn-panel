import React from "react";

import "./UsageStats.css";
import LeadingIcon from "../LeadingIcon";
import { ReactComponent as PieChartIcon } from "../../assets/svg/pie-chart.svg";
import { ReactComponent as DataCenterIcon } from "../../assets/svg/data-center.svg"
import { ReactComponent as GraphBarIcon } from "../../assets/svg/graph-bar.svg"
import { ReactComponent as UsersIcon } from "../../assets/svg/users.svg"
import { ReactComponent as PersonIcon } from "../../assets/svg/person.svg"
import PlusIcon from "../../assets/svg/plus.svg"


const UsageStats = ({ activeUsers, totalUsers, dataUsage, remainingData, allocableData, remainingUsers, lifetime_volume, business_mode,agent_name,onShowBuyVolumePopup }) => {
    return (
        <div className="usage-stats">

            <div className="flex">
                <div className="usage-stats__item">
                    <LeadingIcon>
                        <PersonIcon />
                    </LeadingIcon>
                    <div className="usage-stats__item__label">Agent Name</div>
                    <div className="usage-stats__item__value agent_name_box">{agent_name}</div>
                </div>
            </div>

            <div className="flex">
                <div className="usage-stats__item">
                    <LeadingIcon>
                        <UsersIcon />
                    </LeadingIcon>
                    <div className="usage-stats__item__label">Active Users</div>
                    <div className="usage-stats__item__value"><span>{activeUsers}</span> / {totalUsers}  ({remainingUsers} left)</div>
                </div>
                <div className="usage-stats__item">
                    <LeadingIcon>
                        <GraphBarIcon />
                    </LeadingIcon>
                    <div className="usage-stats__item__label">Data Usage</div>
                    <div className="usage-stats__item__value"><span>{dataUsage}</span> / {lifetime_volume} </div>
                </div>
            </div>
            <div className="flex">
                { /*business_mode == "0" &&*/
                <div className="usage-stats__item">
                    <LeadingIcon>
                        <PieChartIcon />
                    </LeadingIcon>
                    <div className="usage-stats__item__label">Remaining Data</div>
                    <div className="usage-stats__item__value"><span>{remainingData}</span></div>
                </div>
                }

                <div className="usage-stats__item">
                    <LeadingIcon>
                        <DataCenterIcon />
                    </LeadingIcon>

                    
                    <div onClick={()=>onShowBuyVolumePopup()} className="buy_volume_section">
                        <img src={PlusIcon} alt="plus" />
                    </div>

                    <div className="usage-stats__item__label">Allocatable Data</div>
                    <div className="usage-stats__item__value"><span>{allocableData}</span></div>
                </div>
            </div>
        </div>
    )
}

export default UsageStats;