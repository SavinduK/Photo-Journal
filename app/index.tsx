import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Directory, File, Paths } from 'expo-file-system';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Index() {
  const router = useRouter();
  const rootDir = Paths.document.uri+"App/";
  const [entries,setEntries] = useState<any[]>([]);

  // setup directory to save all files
  useEffect(() => {
    const setupDir = async () => {
      try {
        const baseDir = new Directory(rootDir);
        if (!baseDir.exists) {
          await baseDir.create({ intermediates: true });
          console.log("Home directory created:", baseDir.uri);
        }
      } catch (error) {
        console.error("Error setting up home directory:", error);
      }
    };
    setupDir();
  }, []);

  const viewEntry = (uri: string )=>{
    const encodedPath = encodeURIComponent(uri);
    router.push(`/editEntry?path=${encodedPath}`);
  }
  const deleteFile = (file: File|Directory) =>{{
    file.delete();
    loadEntries();
  }}
  //load data
  const loadEntries = useCallback(() => {
  try {
    const dir = new Directory(rootDir);
    const items = dir.list()
    const parsed = items.filter(i => !(i instanceof Directory))
      .map(file => {
        if (file instanceof Directory){
          return 
        }else{
          const json = JSON.parse(file.textSync());
          return { file, json };
        }
      });
    setEntries(parsed);
  } catch (e) {
    console.error("Error loading entries:", e);
    } 
  }, []);

  //load on mount
  useEffect(() => {
  loadEntries();
    }, []);

  //load on back
  useFocusEffect(
  useCallback(() => {
    loadEntries();
  }, [])
  );

  //render data
  const renderEntries = ()=>{
      return entries.map((entry, index) => (
      <View key={index} style={styles.card}>
      <Pressable onPress={() => viewEntry(entry.file.uri)}>
      {entry.json.image ? (
        <Image source={{ uri: entry.json.image }} style={{ width:"100%", height:200 }} />
      ) : null}
      <Text style={styles.text} numberOfLines={4} ellipsizeMode='tail'>{entry.json.text}</Text>
       </Pressable>
      <View style={styles.cardFooter}>
      <Text style={styles.date}>{entry.json.date}</Text>
      <Pressable style={styles.delete} onPress={() => deleteFile(entry.file)}>
        <FontAwesome5 name="trash-alt" size={20} color="#ca0a04e4" />
      </Pressable>
      </View>
  </View>
  ));
  }

  //jsx
  return (
    <SafeAreaView style={styles.container}>
     <View style={styles.titleRow}>
      <Text style={styles.titleText}>Photo Journal</Text>
      <FontAwesome5 name='share-alt' size={20}/>
    </View>
    <ScrollView style={{flex:1}}>
      {renderEntries()}
    </ScrollView>
    <TouchableOpacity style={styles.floatingBtn} onPress={()=>router.push('/addEntry')}>
        <Ionicons name='add' size={32} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  titleRow: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 25,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  floatingBtn: {
    position: "absolute",
    bottom: 40,
    right: 40,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 40,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  card: {
    width: "90%",
    borderRadius: 16,
    marginVertical: 12,
    marginHorizontal: "5%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    overflow: "hidden",
    shadowColor: "#000",
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    maxHeight:350,
  },
  text: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#333",
  },
  date: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "#777",
  },
  delete: {
    padding: 10,
    paddingHorizontal:15,
    elevation: 8,
  },
  cardFooter:{
    borderTopColor:'#777',
    borderTopWidth:1,
    flexDirection:'row',
    justifyContent:'space-between'
  },
});
