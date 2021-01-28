import * as React from 'react';
import {
  Alert,
  Text,
  View,
  StyleSheet,
  SectionList,
  TouchableHighlight,
  Button,
  TextInput,
} from 'react-native';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import { composeAsync } from 'expo-mail-composer';
import { isAvailableAsync, sendSMSAsync } from 'expo-sms';
import {
  getContactsAsync,
  Contact,
  EMAILS,
  PHONE_NUMBERS,
} from 'expo-contacts';
import { groupBy } from 'lodash';

// function useContacts() {
//   const [contacts, setContacts] = React.useState({
//     loading: true,
//     error: null,
//     data: [],
//   });
//   React.useEffect(() => {
//     const fetchContacts = async () => {
//       try {
//         let { status } = await Permissions.getAsync(Permissions.CONTACTS);
//         if (status !== Permissions.PermissionStatus.GRANTED) {
//           // TODO: Handle permissions denied.
//           await Permissions.askAsync(Permissions.CONTACTS);
//         }
//         const data = await getContactsAsync({
//           fields: [EMAILS, PHONE_NUMBERS],
//         });
//         setContacts((state) => ({
//           loading: false,
//           error: null,
//           data: state.data.concat(data.data),
//         }));
//       } catch (ex) {
//         setContacts({
//           loading: false,
//           error: ex,
//           data: [],
//         });
//       }
//     };

//     fetchContacts();
//   }, []);

//   return contacts;
// }

const ContactRow = React.memo(({ onPress, name, emailOrNumber, selected }) => {
  return (
    <TouchableHighlight onPress={onPress}>
      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ marginRight: 16 }}>{selected ? '✅' : '⭕️'}</Text>
        <View style={{ flex: 1 }}>
          <Text>{name || emailOrNumber}</Text>
          {name.length > 0 && (
            <Text style={{ marginTop: 4, color: '#666' }}>{emailOrNumber}</Text>
          )}
        </View>
      </View>
    </TouchableHighlight>
  );
});

function InviteScreen() {
  //@@@@@@@@@@@@@@@@@@
  //const contacts = useContacts();
  const [contacts, setContacts] = React.useState({
    loading: true,
    error: null,
    data: [],
  });
  React.useEffect(() => {
    const fetchContacts = async () => {
      try {
        let { status } = await Permissions.getAsync(Permissions.CONTACTS);
        if (status !== Permissions.PermissionStatus.GRANTED) {
          // TODO: Handle permissions denied.
          await Permissions.askAsync(Permissions.CONTACTS);
        }
        const data = await getContactsAsync({
          fields: [EMAILS, PHONE_NUMBERS],
        });
        setContacts((state) => ({
          loading: false,
          error: null,
          data: state.data.concat(data.data),
        }));
      } catch (ex) {
        setContacts({
          loading: false,
          error: ex,
          data: [],
        });
      }
    };

    fetchContacts();
  }, []);
  //@@@@@@@@@@@@@@@@@@@@@
  //const [contacts, setContacts] = React.useState(useContacts());
  const [selectedContacts, setSelectedContacts] = React.useState([]);
  const sections = React.useMemo(() => {
    return Object.entries(
      groupBy(
        // Create one contact per phone number and email.
        contacts.data.reduce((res, cur) => {
          // contacts.data.reduce((res, cur) => {
          if (cur.phoneNumbers != null) {
            for (const p of cur.phoneNumbers) {
              res.push({
                id: cur.id + p.number,
                name: cur.name || '',
                phoneNumber: p.number,
              });
            }
          }
          if (cur.emails != null) {
            for (const e of cur.emails) {
              res.push({
                id: cur.id + e.email,
                name: cur.name || '',
                email: e.email,
              });
            }
          }
          return res;
        }, []),
        (c) => {
          const firstChar = (c.name.charAt(0) || '#').toLowerCase();
          return firstChar.match(/[a-z]/) ? firstChar : '#';
        }
      )
    )
      .map(([key, value]) => {
        return {
          key,
          data: value.sort((a, b) => {
            return (a.name || a.name || '') < (b.name || b.name || '') ? -1 : 1;
          }),
        };
      })
      .sort((a, b) => (a.key < b.key ? -1 : 1));
  }, [contacts.data]);

  const searchContacts = (value) => {
    const filteredContacts = contacts.data.filter((contact) => {
      let contactLowercase = (
        contact.firstName +
        ' ' +
        contact.lastName
      ).toLowerCase();

      let searchTermLowercase = value.toLowerCase();

      return contactLowercase.indexOf(searchTermLowercase) > -1;
    });
    // contacts = filteredContacts;
    setContacts(filteredContacts);
  };

  const onInvitePress = async () => {
    let didShare = false;
    const message = `Join bigmo. Sign up at https://bigmo.app/signup`;
    const emails = selectedContacts
      .filter((c) => c.email != null)
      .map((c) => c.email);
    const phoneNumbers = selectedContacts
      .filter((c) => c.phoneNumber != null)
      .map((c) => c.phoneNumber);
    if (emails.length > 0) {
      try {
        const result = await composeAsync({
          recipients: emails,
          subject: 'Hello!',
          body: message,
          isHtml: false,
        });
        didShare = didShare || result.status === 'sent';
      } catch (ex) {
        Alert.alert(ex.message);
      }
    }
    if (phoneNumbers.length > 0 && (await isAvailableAsync())) {
      try {
        const result = await sendSMSAsync(phoneNumbers, message);
        didShare = didShare || result.result === 'sent';
      } catch (ex) {
        Alert.alert(ex.message);
      }
    }

    if (didShare) {
      Alert.alert('They shared - can make api calls in here');
      console.log('He shared it.. Can do API calls here');
    }
  };

  if (contacts.loading) {
    return <Text>Loading...</Text>;
  } else if (contacts.error != null) {
    return <Text>Oh no error :( {contacts.error.message}</Text>;
  } else {
    return (
      <View style={styles.container}>
        <Text
          style={{
            paddingTop: 28,
            paddingBottom: 8,
            paddingHorizontal: 16,
            fontSize: 22,
          }}
        >
          Invite friends
        </Text>
        {/* <TextInput
          placeholder='Search'
          placeholderTextColor='#dddddd'
          style={{
            backgroundColor: '#2f363c',
            height: 50,
            fontSize: 20,
            padding: 10,
            color: 'white',
            borderBottomWidth: 0.5,
            borderBottomColor: '#7d90a0',
            borderRadius: 5,
          }}
          //onChangeText={(value) => searchContacts(value)}
        /> */}
        <SectionList
          sections={sections}
          renderSectionHeader={({ section }) => (
            <Text
              style={{
                backgroundColor: '#eee',
                paddingHorizontal: 16,
                paddingVertical: 4,
              }}
            >
              {section.key.toUpperCase()}
            </Text>
          )}
          keyExtractor={(item, index) => item + index}
          renderItem={({ item }) => {
            const selectedIndex = selectedContacts.findIndex(
              (i) => i.id === item.id
            );
            const onPress = () => {
              const newContacts = [...selectedContacts];
              if (selectedIndex >= 0) {
                newContacts.splice(selectedIndex, 1);
              } else {
                newContacts.push(item);
              }
              setSelectedContacts(newContacts);
            };
            return (
              <ContactRow
                name={item.name}
                emailOrNumber={item.email || item.phoneNumber}
                selected={selectedIndex >= 0}
                onPress={onPress}
                key={item.id}
              />
            );
          }}
          extraData={selectedContacts}
          contentContainerStyle={{ paddingBottom: 104 }}
        />
        <View style={{ borderTopColor: '#ccc', borderTopWidth: 1, padding: 8 }}>
          <Button
            title={`Invite (${selectedContacts.length})`}
            onPress={onInvitePress}
            disabled={selectedContacts.length === 0}
          />
        </View>
      </View>
    );
  }
}

export default class App extends React.Component {
  render() {
    return <InviteScreen />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
