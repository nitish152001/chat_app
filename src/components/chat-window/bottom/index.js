/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable arrow-body-style */
import firebase from 'firebase/app';
import React, { useCallback, useState } from 'react';
import { Alert, Icon, Input, InputGroup } from 'rsuite';
import { useParams } from 'react-router';
import { useProfile } from '../../../context/profile.context';
import { database } from '../../../misc/firebase';
import AttachmentBtnModal from './AttachmentBtnModal';
import AudioMsgBtn from './AudioMsgBtn';

function assembleMessages(profile, chatId) {
  return {
    roomId: chatId,
    // below we denormalise our data
    author: {
      name: profile.name,
      uid: profile.uid,
      createdAt: profile.createdAt,
      // due to the 3 dots the avatar:profile.avatar object get spread with the other objects
      ...(profile.avatar ? { avatar: profile.avatar } : {}),
    },
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    likeCount:0,
  };
}

const Bottom = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const onInputChange = useCallback(value => {
    setInput(value);
  }, []);
  const { chatId } = useParams();
  const { profile } = useProfile();
  const onSendClick = async () => {
    if (input.trim() === '') {
      return;
    }
    const msgData = assembleMessages(profile, chatId);
    // console.log(msgData);
    msgData.text = input;
    // we provide all update paths to below object
    const updates = {};
    // by below we get a unique key
    const messageId = database.ref('messages').push().key;
    // below is the way to do updates at two path at the same time , to do it we provide there paths below
    updates[`/messages/${messageId}`] = msgData;
    updates[`/rooms/${chatId}/lastMessage`] = {
      ...msgData,
      msgId: messageId,
    };
    setIsLoading(true);
    try {
      // by just writing update without anything inside we provide a reference to root of the database
      await database.ref().update(updates);
      setInput('');
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.error(error.message, 4000);
      // console.log(error.message);
    }
  };

  const onKeyDown = ev => {
    if (ev.keyCode === 13) {
      //   below to prevent any default functionality with this button
      // console.log('hello');
      ev.preventDefault();
      onSendClick();
    }
  };

  const afterUpload=useCallback(async (files)=>{
    setIsLoading(true)
    const updates={}
    files.forEach(file=>{

      const msgData = assembleMessages(profile, chatId);
    msgData.file = file;
      const messageId = database.ref('messages').push().key;
      updates[`/messages/${messageId}`] = msgData;
    })
    const lastMsgId=Object.keys(updates).pop();
    updates[`/rooms/${chatId}/lastMessage`] = {
      ...updates[lastMsgId],
      msgId: lastMsgId,
    };
    try {
      // by just writing update without anything inside we provide a reference to root of the database
      await database.ref().update(updates);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.error(error.message, 4000);
    }
  },[chatId,profile])
  return (
    <div>
      <InputGroup>
      <AttachmentBtnModal afterUpload={afterUpload}/>
      <AudioMsgBtn afterUpload={afterUpload}/>
        <Input
          placeholder="Write a  new Message here ..."
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
        />
        <InputGroup.Button
          color="blue"
          appearance="primary"
          onClick={onSendClick}
          disabled={isLoading}
        >
          <Icon icon="send" />
        </InputGroup.Button>
      </InputGroup>
    </div>
  );
};

export default Bottom;
