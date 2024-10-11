import time
from base64 import b64decode, b64encode
from datetime import datetime, timedelta
from functools import lru_cache
from hashlib import sha256
from math import ceil
from typing import Union

from jose import JWTError, jwt

from config import JWT_ACCESS_TOKEN_EXPIRE_MINUTES

with open('/code/app/utils/usernames.txt', 'r') as f:
    usernames = f.readlines()
    usernames = [x.strip() for x in usernames]

@lru_cache(maxsize=None)
def get_secret_key():
    from app.db import GetDB, get_jwt_secret_key
    with GetDB() as db:
        return get_jwt_secret_key(db)


def create_admin_token(username: str, is_sudo=False) -> str:
    data = {"sub": username, "access": "sudo" if is_sudo else "admin", "iat": datetime.utcnow()}
    if JWT_ACCESS_TOKEN_EXPIRE_MINUTES > 0:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        data["exp"] = expire
    encoded_jwt = jwt.encode(data, get_secret_key(), algorithm="HS256")
    return encoded_jwt


def get_admin_payload(token: str) -> Union[dict, None]:
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=["HS256"])
        username: str = payload.get("sub")
        access: str = payload.get("access")
        if not username or access not in ('admin', 'sudo'):
            return
        try:
            created_at = datetime.utcfromtimestamp(payload['iat'])
        except KeyError:
            created_at = None

        return {"username": username, "is_sudo": access == "sudo", "created_at": created_at}
    except JWTError:
        return


def create_subscription_token(username: str) -> str:
    data = username + ',' + str(ceil(time.time()))
    data_b64_str = b64encode(data.encode('utf-8'), altchars=b'-_').decode('utf-8').rstrip('=')
    data_b64_sign = b64encode(
        sha256(
            (data_b64_str+get_secret_key()).encode('utf-8')
        ).digest(),
        altchars=b'-_'
    ).decode('utf-8')[:10]
    data_final = data_b64_str + data_b64_sign
    return data_final


def get_subscription_payload(token: str) -> Union[dict, None]:
    try:
        if len(token) < 15:
            return

        if token.startswith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."):
            payload = jwt.decode(token, get_secret_key(), algorithms=["HS256"])
            if payload.get("access") == "subscription":
                new_username = get_username_from_file(payload['sub'])
                print("*********************")
                print(new_username)
                print("*********************")
                return {"username": new_username, "created_at": datetime.utcfromtimestamp(payload['iat'])}
            else:
                return
        else:
            u_token = token[:-10]
            try:
                u_token_dec = b64decode(
                    (u_token.encode('utf-8') + b'=' * (-len(u_token.encode('utf-8')) % 4)),
                    altchars=b'-_', validate=True)
                u_token_dec_str = u_token_dec.decode('utf-8')
            except:
                return

            u_username = u_token_dec_str.split(',')[0]
            u_username = get_username_from_file(u_username)
            print("*********************")
            print(u_username)
            print("*********************")
            u_created_at = int(u_token_dec_str.split(',')[1])
            return {"username": u_username, "created_at": datetime.utcfromtimestamp(u_created_at)}
    except JWTError:
        return


def get_username_from_file(username: str) -> str:
    if username.startswith('Servergad-'):
        username = username.replace('Servergad-', 'Servergad_')
    if username.startswith('servergad-'):
        username = username.replace('servergad-', 'Servergad_')
    if username.startswith('khaledi_'):
        username = 'Mobile' + username
    if username.startswith('khaledimobile_'):
        username = username.replace('khaledimobile_', 'Mobilekhaledi_')
    if username.startswith('khalediMobile_'):
        username = username.replace('khalediMobile_', 'Mobilekhaledi_')
    if username.startswith('KhalediMobile_'):
        username = username.replace('KhalediMobile_', 'Mobilekhaledi_')
    for u in usernames:
        if username in u:
            return u
    return username

# mongosh --eval 'db.users.find({}, { username: 1, _id: 0 }).forEach(user => print(user.username))' KN_PANEL > usernames.txt
# docker cp /root/marzban_new/jwt.py d75:/code/app/utils/
# docker cp /root/marzban_new/usernames.txt d75:/code/app/utils/