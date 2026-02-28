import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Index() {
  const router = useRouter();
  const [text,setText] = useState('');
  const [image,setImage] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const rootDir = Paths.document.uri+"App/";
  
  const insertImage = async()=>{
      if(image == ''){
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64:true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const {base64,type} = result.assets[0];
        const uri = `data:image/jpeg;base64,${base64}`;
        setImage(uri);
      } else {
        Alert.alert("No image selected");
      }}
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
  // Hide picker for Android immediately
  setShowPicker(false); 
  if (selectedDate) {
    setDate(selectedDate);
  }};

 //submit function to use the selected 'date' state
  const submit = () => {
  if (image === '' && text === '') return;
  // Format the date for the JSON storage
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const entryId = date.getTime().toString(); // Use timestamp as filename to avoid collisions
  const data = { "text": text, "image": image, "date": formattedDate ,"id":date.getTime()};

  const jsonFile = new File(rootDir + entryId + '.json');
  jsonFile.create();
  jsonFile.write(JSON.stringify(data));
  router.push('/');
}
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}enableOnAndroid={true} extraScrollHeight={80}>  
      <ScrollView style={styles.scroll}>
      <View style={styles.titleRow}>
      <Pressable onPress={()=>router.push('/')}><Ionicons name='chevron-back' size={25}/></Pressable>
      <Text style={styles.titleText}>New Entry</Text>
      <Pressable style={styles.submit} onPress={()=>submit()}><FontAwesome5 name="check" size={20} color='white'/></Pressable>
      </View>
      <Text style={styles.text}>IMAGE</Text>
      <View style={image === '' ? styles.dashedOutline  : styles.imageOutline}>
      <Pressable onPress={()=>insertImage()} style={{flex:1,justifyContent:'center'}}>
        {image === '' ? (
          <View style={styles.imgIcon}>
            <Ionicons name="image-outline" size={30}/>
            <Text style={styles.text}>Add Image</Text>
          </View>
          ):(
          <View style={styles.imageWrapper}>
            <Pressable style={styles.removeBtn} onPress={() => setImage('')}>
              <Ionicons name="close" size={18} color="white" />
            </Pressable>
            <Image
              source={{ uri: image }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
          )}
      </Pressable>
    </View>
    <Text style={styles.text}>DATE</Text>
    <Pressable style={styles.dateSelector} onPress={() => setShowPicker(true)}>
      <Ionicons name="calendar-outline" size={20} color="#007AFF" />
      <Text style={styles.dateValueText}>
        {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </Text>
    </Pressable>
    {showPicker && (
      <DateTimePicker
        value={date}
        mode="date"
        display="default"
        onChange={onDateChange}
        maximumDate={new Date()} // Prevent picking future dates
      />
    )}
    <Text style={styles.text}>NOTE</Text>
        <View style={styles.textCard}>
          <TextInput
            multiline = {true}
            placeholder="Describe Your Day...."
            value={text}
            onChangeText={setText} 
        />
    </View>
    </ScrollView>
    </KeyboardAwareScrollView> 
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  titleRow: {
    flexDirection: "row",
    padding: 10,
    paddingHorizontal:20,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  submit: {
    padding: 10,
    borderRadius: 90,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    backgroundColor:'#007AFF'
  },
  delete: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  imageOutline: {
    width: "85%",
    height: 260,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  dashedOutline:{
    width: "85%",
    height: 260,
    borderWidth: 1.5,
    borderRadius: 18,
    borderColor: "#999",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
    borderStyle: "dashed",
  },
  imgIcon:{
    alignItems:'center',
    alignSelf:'center'
  },
  textCard: {
    width: "85%",
    minHeight: 300,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 12,
    alignSelf: "center",
    padding: 12,
    backgroundColor: "white",
    marginBottom: 40,
  },
  imageWrapper: {
  width: "100%",
  height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  removeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 6,
  },
  dateSelector: {
    width: "85%",
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
    padding: 15,
    alignSelf: 'center',
    marginBottom: 10,
  },
  dateValueText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    fontWeight: '500'
  },
});
